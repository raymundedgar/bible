import { describe, expect, it } from "vitest";
import { catalogBooks } from "../src/lib/bible/client";
import { passages } from "../src/lib/passages";
import { THEMES } from "../src/lib/themes";

describe("book catalog and curated index", () => {
  const books = new Map(catalogBooks().map((book) => [book.id, book]));

  it("uses the 73-book eng_webc catalog", () => {
    expect(books.size).toBe(73);
    expect(books.get("ESG")?.commonName).toBe("Esther (Greek)");
    expect(books.get("DAG")?.commonName).toBe("Daniel (Greek)");
    expect(books.get("SIR")?.isApocryphal).toBe(true);
    expect(books.get("PSA")?.isApocryphal).toBe(false);
    expect(books.has("EST")).toBe(false);
    expect(books.has("DAN")).toBe(false);
  });

  it("stores references and themes only, with canon flags that match the catalog", () => {
    const ids = new Set<string>();
    for (const passage of passages) {
      expect(ids.has(passage.id)).toBe(false);
      ids.add(passage.id);
      expect(passage).not.toHaveProperty("text");
      const book = books.get(passage.book);
      expect(book, passage.book).toBeDefined();
      expect(passage.chapter).toBeLessThanOrEqual(book!.numberOfChapters);
      expect(passage.canon).toBe(book!.isApocryphal ? "deuterocanonical" : "protocanonical");
      for (const theme of passage.themes) expect(THEMES).toContain(theme);
    }
  });
});
