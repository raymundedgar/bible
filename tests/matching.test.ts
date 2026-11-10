import { describe, expect, it } from "vitest";
import { identifyThemes } from "../src/lib/matching/lexicon";
import { pickDiverse, scorePassages } from "../src/lib/matching/rank";
import { passages } from "../src/lib/passages";

describe("theme identification", () => {
  it("maps the main example situations onto the controlled list", () => {
    expect(identifyThemes("I'm worried about my future and afraid I might fail.").themes).toEqual(
      expect.arrayContaining(["anxiety", "future", "fear"]),
    );
    expect(identifyThemes("I'm feeling lonely and don't know what to do.").themes).toEqual(
      expect.arrayContaining(["loneliness", "uncertainty", "guidance"]),
    );
    expect(identifyThemes("I'm grateful for a new opportunity.").general).toBe(false);
    expect(identifyThemes("I'm struggling to forgive someone.").themes).toContain("forgiveness");
    expect(identifyThemes("I'm going through a difficult time.").themes).toEqual(
      expect.arrayContaining(["perseverance", "encouragement"]),
    );
    expect(identifyThemes("I feel anxious about an important decision.").themes).toEqual(
      expect.arrayContaining(["anxiety", "decision-making"]),
    );
  });

  it("uses a general match when no theme is recognized", () => {
    const match = identifyThemes("asdf qwerty");
    expect(match.general).toBe(true);
    expect(match.themes).toEqual(["encouragement", "hope", "peace"]);
  });
});

describe("ranking", () => {
  it("skips excluded passages and avoids repeating a chapter", () => {
    const weights = identifyThemes("I'm feeling anxious and worried.").weights;
    const ranked = scorePassages(passages, weights, new Set(["PHP.4.6-7"]));
    expect(ranked.some((item) => item.passage.id === "PHP.4.6-7")).toBe(false);
    const picked = pickDiverse(ranked, 3);
    const chapters = picked.picked.map((passage) => `${passage.book}:${passage.chapter}`);
    expect(new Set(chapters).size).toBe(picked.picked.length);
    expect(picked.picked.length).toBeGreaterThan(0);
  });
});
