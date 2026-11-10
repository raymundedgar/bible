import { describe, expect, it } from "vitest";
import { detectCrisis } from "../src/lib/crisis";
import type { AppEnv } from "../src/lib/env";
import { resolveEnv } from "../src/lib/env";
import { validatePrompt } from "../src/lib/prompt";
import { resetRateLimitForTests, rateLimit } from "../src/lib/rate-limit";
import { recommend } from "../src/lib/recommend";

const env: AppEnv = {
  bibleApiBaseUrl: "https://bible.example.test/api",
  bibleTranslationId: "eng_webc",
  aiEnabled: true,
  aiProvider: "openai",
  aiApiBaseUrl: "https://ai.example.test/v1",
  aiApiKey: "test-key",
  aiModel: "test-model",
};

function chapterResponse(book: string, commonName: string, chapter: number, start: number, end: number) {
  const content = [];
  for (let number = start; number <= end; number += 1) {
    content.push({
      type: "verse",
      number,
      text: `[mock verse ${book} ${chapter}:${number} — not Scripture]`,
    });
  }
  return {
    book: { id: book, name: commonName, commonName, isApocryphal: book === "SIR" || book === "WIS" },
    numberOfVerses: end,
    chapter: { number: chapter, content },
    translation: {
      id: "eng_webc",
      name: "World English Bible (Catholic)",
      shortName: "WEBC",
    },
  };
}

function mockFetch(aiStatus = 503): typeof fetch {
  return async (input, init) => {
    const url = String(input);
    if (url.includes("ai.example.test")) {
      return new Response("unavailable", { status: aiStatus });
    }
    const match = url.match(/\/([A-Z0-9]+)\/(\d+)\.simple\.json$/);
    if (!match) return new Response("missing", { status: 404 });
    const book = match[1];
    const chapter = Number(match[2]);
    return new Response(JSON.stringify(chapterResponse(book, book, chapter, 1, 176)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

describe("prompt and safety checks", () => {
  it("rejects empty and oversized prompts", () => {
    expect(validatePrompt("  ").ok).toBe(false);
    expect(validatePrompt("x".repeat(1501)).ok).toBe(false);
    expect(validatePrompt("I feel anxious").ok).toBe(true);
  });

  it("detects crisis language without treating idioms as a crisis", () => {
    expect(detectCrisis("I want to die")).toBe(true);
    expect(detectCrisis("This deadline is killing me")).toBe(false);
  });

  it("limits repeated requests", () => {
    resetRateLimitForTests();
    expect(rateLimit("test", 2, 1000, 0).ok).toBe(true);
    expect(rateLimit("test", 2, 1000, 10).ok).toBe(true);
    expect(rateLimit("test", 2, 1000, 20).ok).toBe(false);
  });

  it("keeps AI off unless the flag and credentials are all present", () => {
    expect(resolveEnv({ AI_ENABLED: "true" }).aiEnabled).toBe(false);
    const gemini = resolveEnv({ AI_ENABLED: "true", GEMINI_API_KEY: "secret" });
    expect(gemini.aiEnabled).toBe(true);
    expect(gemini.aiProvider).toBe("gemini");
    expect(gemini.aiModel).toBe("gemini-3.5-flash-lite");
    expect(gemini.aiApiBaseUrl).toBe("https://generativelanguage.googleapis.com/v1beta");
  });
});

describe("recommendations", () => {
  it("falls back to prepared reflections when the AI provider fails", async () => {
    const result = await recommend({
      prompt: "I'm feeling anxious and worried about a decision.",
      env,
      fetchImpl: mockFetch(429),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.aiUsed).toBe(false);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.length).toBeLessThanOrEqual(3);
    for (const item of result.results) {
      expect(item.text).toContain("[mock verse");
      expect(item.text).toContain("not Scripture");
      expect(item.reference.length).toBeGreaterThan(3);
    }
  });

  it("does not send a crisis prompt to the AI provider", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      calls.push(String(input));
      return mockFetch()(input, init);
    };
    const result = await recommend({
      prompt: "I want to die and I feel hopeless.",
      env,
      fetchImpl,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.crisis).toBe(true);
    expect(result.support?.resources.length).toBeGreaterThan(0);
    expect(calls.some((url) => url.includes("ai.example.test"))).toBe(false);
    expect(result.aiUsed).toBe(false);
  });

  it("uses a validated AI explanation without replacing the verse text", async () => {
    const first = await recommend({
      prompt: "I'm feeling anxious and worried.",
      env: { ...env, aiEnabled: false },
      fetchImpl: mockFetch(),
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const reference = first.results[0].reference;
    const fetchWithMatch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("ai.example.test")) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    recommendations: [
                      {
                        reference,
                        why_it_relates: "This passage may encourage you because of the verified text.",
                        encouragement: "Take one gentle step.",
                      },
                      {
                        reference: "Invented 1:1",
                        why_it_relates: "Drop me.",
                        encouragement: "Drop me.",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        );
      }
      return mockFetch()(input);
    };

    const result = await recommend({
      prompt: "I'm feeling anxious and worried.",
      env,
      fetchImpl: fetchWithMatch,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.aiUsed).toBe(true);
    expect(result.results.some((item) => item.reference === "Invented 1:1")).toBe(false);
    expect(result.results[0].text).toContain("not Scripture");
    expect(result.results[0].whyItRelates).toContain("verified text");
  });
});
