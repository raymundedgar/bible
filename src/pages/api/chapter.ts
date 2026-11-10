import type { APIRoute } from "astro";
import { BibleSourceError, fetchChapter } from "../../lib/bible/client";
import { resolveEnv } from "../../lib/env";
import { clientKey, rateLimit } from "../../lib/rate-limit";
import { cloudflareBindings } from "../../lib/runtime-env";

export const prerender = false;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const limit = rateLimit(`chapter:${clientKey(request)}`, 60, 10 * 60 * 1000);
  if (!limit.ok) {
    return json(
      { ok: false, message: "Too many chapter requests just now. Please wait a little while and try again." },
      429,
    );
  }

  const url = new URL(request.url);
  const book = (url.searchParams.get("book") ?? "").toUpperCase();
  const chapter = Number(url.searchParams.get("chapter"));
  if (!/^[A-Z0-9]{2,4}$/.test(book) || !Number.isInteger(chapter)) {
    return json({ ok: false, message: "That chapter could not be found." }, 400);
  }

  const env = resolveEnv(cloudflareBindings());

  try {
    const result = await fetchChapter({
      baseUrl: env.bibleApiBaseUrl,
      translationId: env.bibleTranslationId,
      book,
      chapter,
    });
    return json({ ok: true, ...result, translationLabel: "World English Bible, Catholic edition" }, 200);
  } catch (error) {
    if (error instanceof BibleSourceError && (error.status === 404 || error.status === 400)) {
      return json({ ok: false, message: "That chapter could not be found in this translation." }, 404);
    }
    console.info(
      JSON.stringify({
        event: "chapter",
        ok: false,
        book,
        chapter,
        error: error instanceof Error ? error.name : "unknown",
      }),
    );
    return json(
      { ok: false, message: "The Scripture source is unavailable right now. Please try again in a moment." },
      503,
    );
  }
};
