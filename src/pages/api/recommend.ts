import type { APIRoute } from "astro";
import { resolveEnv } from "../../lib/env";
import { clientKey, rateLimit } from "../../lib/rate-limit";
import { recommend } from "../../lib/recommend";
import { cloudflareBindings } from "../../lib/runtime-env";

export const prerender = false;

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 12;

function json(body: unknown, status: number, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const started = Date.now();
  const env = resolveEnv(cloudflareBindings());
  const limit = rateLimit(`recommend:${clientKey(request)}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return json(
      {
        ok: false,
        message: "Too many requests just now. Please wait a little while and try again.",
      },
      429,
      { "retry-after": String(limit.retryAfterSeconds) },
    );
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 20_000) {
      return json(
        { ok: false, message: "That message is too long to send. Please shorten it and try again." },
        400,
      );
    }
    payload = JSON.parse(raw) as unknown;
  } catch {
    return json({ ok: false, message: "The request could not be read. Please try again." }, 400);
  }

  if (!payload || typeof payload !== "object") {
    return json({ ok: false, message: "The request could not be read. Please try again." }, 400);
  }

  const body = payload as { prompt?: unknown; exclude?: unknown };
  let result;
  try {
    result = await recommend({
      prompt: body.prompt,
      exclude: body.exclude,
      env,
    });
  } catch (error) {
    console.info(
      JSON.stringify({
        event: "recommend",
        ok: false,
        error: error instanceof Error ? error.name : "unknown",
        ms: Date.now() - started,
      }),
    );
    return json(
      {
        ok: false,
        message: "The Scripture source is unavailable right now. Please try again in a moment.",
      },
      503,
    );
  }

  console.info(
    JSON.stringify({
      event: "recommend",
      ok: result.ok,
      status: result.ok ? 200 : result.status,
      aiUsed: result.ok ? result.aiUsed : false,
      crisis: result.ok ? result.crisis : false,
      results: result.ok ? result.results.length : 0,
      ms: Date.now() - started,
    }),
  );

  if (!result.ok) return json({ ok: false, message: result.message }, result.status);
  return json(result, 200);
};
