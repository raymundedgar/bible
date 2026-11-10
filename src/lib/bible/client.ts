import snapshot from "../../data/books.json";
import {
  booksFileSchema,
  simpleChapterSchema,
  type CatalogBook,
  type SimpleChapter,
} from "./schema";
import { joinVerseText } from "./format";

const MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
const memory = new Map<string, { expires: number; data: unknown }>();

export class BibleSourceError extends Error {
  status: number;

  constructor(status: number) {
    super("bible_source_error");
    this.name = "BibleSourceError";
    this.status = status;
  }
}

export interface VersePassage {
  bookId: string;
  commonName: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  text: string;
  isApocryphal: boolean;
  translationName: string;
  translationShort: string;
}

const catalog = booksFileSchema.parse(snapshot);
const booksById = new Map(catalog.books.map((book) => [book.id, book]));

export function catalogBooks(): CatalogBook[] {
  return catalog.books;
}

export function catalogBook(id: string): CatalogBook | undefined {
  return booksById.get(id);
}

export function resetBibleCacheForTests(): void {
  memory.clear();
}

async function readCache(url: string): Promise<unknown | undefined> {
  const cached = memory.get(url);
  if (cached && cached.expires > Date.now()) return cached.data;

  if (typeof caches === "undefined") return undefined;
  try {
    const hit = await caches.default.match(url);
    if (!hit) return undefined;
    const data: unknown = await hit.json();
    memory.set(url, { expires: Date.now() + MEMORY_TTL_MS, data });
    return data;
  } catch {
    return undefined;
  }
}

async function writeCache(url: string, data: unknown): Promise<void> {
  memory.set(url, { expires: Date.now() + MEMORY_TTL_MS, data });
  if (typeof caches === "undefined") return;
  try {
    await caches.default.put(
      url,
      new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json", "cache-control": "public, max-age=86400" },
      }),
    );
  } catch {
    // The Cache API is not available in every runtime. Memory cache still applies.
  }
}

async function fetchJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const cached = await readCache(url);
  if (cached !== undefined) return cached;

  const response = await fetchImpl(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new BibleSourceError(response.status);
  const data: unknown = await response.json();
  await writeCache(url, data);
  return data;
}

export function extractVerseText(
  chapter: SimpleChapter,
  verseStart: number,
  verseEnd: number,
): string | null {
  const verses = chapter.chapter.content.filter(
    (item) =>
      item.type === "verse" &&
      typeof item.number === "number" &&
      typeof item.text === "string" &&
      item.number >= verseStart &&
      item.number <= verseEnd,
  );

  const expected = verseEnd - verseStart + 1;
  if (verses.length !== expected) return null;
  return joinVerseText(verses.map((verse) => verse.text ?? ""));
}

export async function fetchVerseRange(options: {
  baseUrl: string;
  translationId: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  fetchImpl?: typeof fetch;
}): Promise<VersePassage> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const known = catalogBook(options.book);
  if (!known) throw new BibleSourceError(404);
  if (options.chapter < 1 || options.chapter > known.numberOfChapters) {
    throw new BibleSourceError(404);
  }

  const url = `${options.baseUrl}/${options.translationId}/${options.book}/${options.chapter}.simple.json`;
  const parsed = simpleChapterSchema.parse(await fetchJson(url, fetchImpl));
  if (parsed.book.id !== options.book || parsed.chapter.number !== options.chapter) {
    throw new BibleSourceError(502);
  }
  if (parsed.translation.id !== options.translationId) {
    throw new BibleSourceError(502);
  }

  const text = extractVerseText(parsed, options.verseStart, options.verseEnd);
  if (!text) throw new BibleSourceError(404);

  return {
    bookId: parsed.book.id,
    commonName: parsed.book.commonName,
    chapter: parsed.chapter.number,
    verseStart: options.verseStart,
    verseEnd: options.verseEnd,
    text,
    isApocryphal: parsed.book.isApocryphal ?? known.isApocryphal,
    translationName: parsed.translation.name,
    translationShort: parsed.translation.shortName,
  };
}

export async function fetchChapter(options: {
  baseUrl: string;
  translationId: string;
  book: string;
  chapter: number;
  fetchImpl?: typeof fetch;
}): Promise<{
  bookId: string;
  commonName: string;
  chapter: number;
  isApocryphal: boolean;
  translationName: string;
  translationShort: string;
  verses: { number: number; text: string }[];
}> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const known = catalogBook(options.book);
  if (!known) throw new BibleSourceError(404);
  if (options.chapter < 1 || options.chapter > known.numberOfChapters) {
    throw new BibleSourceError(404);
  }

  const url = `${options.baseUrl}/${options.translationId}/${options.book}/${options.chapter}.simple.json`;
  const parsed = simpleChapterSchema.parse(await fetchJson(url, fetchImpl));
  const verses = parsed.chapter.content
    .filter(
      (item): item is { type: string; number: number; text: string } =>
        item.type === "verse" &&
        typeof item.number === "number" &&
        typeof item.text === "string",
    )
    .map((verse) => ({ number: verse.number, text: verse.text }));

  if (verses.length === 0) throw new BibleSourceError(502);

  return {
    bookId: parsed.book.id,
    commonName: parsed.book.commonName,
    chapter: parsed.chapter.number,
    isApocryphal: parsed.book.isApocryphal ?? known.isApocryphal,
    translationName: parsed.translation.name,
    translationShort: parsed.translation.shortName,
    verses,
  };
}
