import { describe, expect, it } from "vitest";
import { extractVerseText, fetchVerseRange, resetBibleCacheForTests } from "../src/lib/bible/client";
import { formatReference } from "../src/lib/bible/format";
import type { SimpleChapter } from "../src/lib/bible/schema";

const mockChapter: SimpleChapter = {
  book: { id: "PRO", name: "Proverbs", commonName: "Proverbs" },
  numberOfVerses: 2,
  chapter: {
    number: 3,
    content: [
      { type: "heading" },
      { type: "verse", number: 5, text: "[mock verse 5 — not Scripture]" },
      { type: "verse", number: 6, text: "[mock verse 6 — not Scripture]" },
    ],
  },
  translation: { id: "eng_webc", name: "Mock translation", shortName: "WEBC" },
};

describe("verse extraction", () => {
  it("joins only the requested mock verses", () => {
    expect(extractVerseText(mockChapter, 5, 6)).toBe(
      "[mock verse 5 — not Scripture]\n\n[mock verse 6 — not Scripture]",
    );
    expect(extractVerseText(mockChapter, 5, 7)).toBeNull();
  });

  it("formats the reference from the source book name", () => {
    expect(formatReference("Psalms", 23, 1, 4)).toBe("Psalms 23:1-4");
    expect(formatReference("John", 11, 35, 35)).toBe("John 11:35");
  });

  it("rejects verse text that did not come from the mocked source response", async () => {
    resetBibleCacheForTests();
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify(mockChapter), { status: 200, headers: { "content-type": "application/json" } });

    const verse = await fetchVerseRange({
      baseUrl: "https://bible.example.test/api",
      translationId: "eng_webc",
      book: "PRO",
      chapter: 3,
      verseStart: 5,
      verseEnd: 6,
      fetchImpl,
    });

    expect(verse.text).toContain("[mock verse");
    expect(verse.text).not.toMatch(/Trust in the LORD/i);
  });
});
