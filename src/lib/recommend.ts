import { AiProviderError, requestExplanations } from "./ai/adapter";
import { explanationsFromAi } from "./ai/schema";
import { BibleSourceError, fetchVerseRange, type VersePassage } from "./bible/client";
import { formatReference } from "./bible/format";
import { detectCrisis, supportNotice, type SupportNotice } from "./crisis";
import type { AppEnv } from "./env";
import { identifyThemes } from "./matching/lexicon";
import { pickDiverse, scorePassages } from "./matching/rank";
import { passages, type Passage } from "./passages";
import { sanitizeExclude, validatePrompt } from "./prompt";

const RESULT_COUNT = 1;

export interface Recommendation {
  role: "main" | "another" | "reflection";
  roleLabel: string;
  id: string;
  reference: string;
  translationName: string;
  translationShort: string;
  canon: "protocanonical" | "deuterocanonical";
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  text: string;
  whyItRelates: string;
  encouragement: string;
}

export interface RecommendSuccess {
  ok: true;
  aiUsed: boolean;
  generalMatch: boolean;
  crisis: boolean;
  themes: string[];
  support: SupportNotice | null;
  results: Recommendation[];
  hasMore: boolean;
  notice: string;
}

export interface RecommendFailure {
  ok: false;
  status: number;
  message: string;
  retryAfterSeconds?: number;
}

const ROLES: { role: Recommendation["role"]; roleLabel: string }[] = [
  { role: "main", roleLabel: "Main recommendation" },
  { role: "another", roleLabel: "Another perspective" },
  { role: "reflection", roleLabel: "For further reflection" },
];

const TRANSLATION_LABEL = "World English Bible, Catholic edition";

async function loadPassage(
  passage: Passage,
  env: AppEnv,
  fetchImpl: typeof fetch,
): Promise<VersePassage | null> {
  try {
    return await fetchVerseRange({
      baseUrl: env.bibleApiBaseUrl,
      translationId: env.bibleTranslationId,
      book: passage.book,
      chapter: passage.chapter,
      verseStart: passage.verseStart,
      verseEnd: passage.verseEnd,
      fetchImpl,
    });
  } catch (error) {
    if (error instanceof BibleSourceError) return null;
    throw error;
  }
}

export async function recommend(options: {
  prompt: unknown;
  exclude?: unknown;
  env: AppEnv;
  fetchImpl?: typeof fetch;
}): Promise<RecommendSuccess | RecommendFailure> {
  const prompt = validatePrompt(options.prompt);
  if (!prompt.ok) return { ok: false, status: 400, message: prompt.message };

  const fetchImpl =
    options.fetchImpl ??
    ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));
  const exclude = new Set(sanitizeExclude(options.exclude));
  const crisis = detectCrisis(prompt.text);
  const themes = identifyThemes(prompt.text);
  const ranked = scorePassages(passages, themes.weights, exclude);
  const selection = pickDiverse(ranked, RESULT_COUNT);
  const pool = ranked.map((item) => item.passage);

  const loaded = new Map<string, VersePassage>();
  const chosen: Passage[] = [];
  const usedChapters = new Set<string>();

  const take = async (passage: Passage, allowSameChapter: boolean) => {
    if (chosen.some((item) => item.id === passage.id)) return;
    const chapterKey = `${passage.book}:${passage.chapter}`;
    if (!allowSameChapter && usedChapters.has(chapterKey)) return;
    const verse = await loadPassage(passage, options.env, fetchImpl);
    if (!verse) return;
    usedChapters.add(chapterKey);
    loaded.set(passage.id, verse);
    chosen.push(passage);
  };

  for (const passage of selection.picked) {
    await take(passage, false);
    if (chosen.length === RESULT_COUNT) break;
  }
  if (chosen.length < RESULT_COUNT) {
    for (const passage of pool) {
      await take(passage, false);
      if (chosen.length === RESULT_COUNT) break;
    }
  }
  if (chosen.length < RESULT_COUNT) {
    for (const passage of pool) {
      await take(passage, true);
      if (chosen.length === RESULT_COUNT) break;
    }
  }

  if (chosen.length === 0) {
    return {
      ok: false,
      status: 503,
      message:
        "The Scripture source is unavailable right now. Please try again in a moment.",
    };
  }

  const verified = chosen.map((passage) => {
    const verse = loaded.get(passage.id);
    if (!verse) throw new Error("missing_verified_verse");
    return {
      passage,
      verse,
      reference: formatReference(
        verse.commonName,
        verse.chapter,
        verse.verseStart,
        verse.verseEnd,
      ),
    };
  });

  let aiUsed = false;
  const aiText = new Map<string, { whyItRelates: string; encouragement: string }>();

  if (options.env.aiEnabled && !crisis) {
    try {
      const raw = await requestExplanations({
        provider: options.env.aiProvider,
        baseUrl: options.env.aiApiBaseUrl,
        apiKey: options.env.aiApiKey,
        model: options.env.aiModel,
        situation: prompt.text,
        passages: verified.map((item) => ({
          reference: item.reference,
          text: item.verse.text,
          contextNote: item.passage.contextNote,
        })),
        fetchImpl,
      });
      const allowed = new Map(verified.map((item) => [item.reference, item.passage.id]));
      const explanations = explanationsFromAi(raw, allowed);
      if (explanations.size > 0) {
        aiUsed = true;
        for (const [id, explanation] of explanations) aiText.set(id, explanation);
      }
    } catch (error) {
      const status = error instanceof AiProviderError ? error.status : 0;
      console.info(
        JSON.stringify({
          event: "ai",
          ok: false,
          status,
          name: error instanceof Error ? error.name : "unknown",
        }),
      );
      if (!(error instanceof AiProviderError) && !(error instanceof Error)) throw error;
    }
  }

  const results: Recommendation[] = verified.map((item, index) => {
    const role = ROLES[index] ?? ROLES[ROLES.length - 1];
    const generated = aiText.get(item.passage.id);
    return {
      role: role.role,
      roleLabel: role.roleLabel,
      id: item.passage.id,
      reference: item.reference,
      translationName: TRANSLATION_LABEL,
      translationShort: item.verse.translationShort || "WEBC",
      canon: item.verse.isApocryphal ? "deuterocanonical" : "protocanonical",
      bookId: item.verse.bookId,
      chapter: item.verse.chapter,
      verseStart: item.verse.verseStart,
      verseEnd: item.verse.verseEnd,
      text: item.verse.text,
      whyItRelates: generated?.whyItRelates ?? item.passage.fallbackWhy,
      encouragement: generated?.encouragement ?? item.passage.fallbackEncouragement,
    };
  });

  const chosenIds = new Set(results.map((result) => result.id));
  const hasMore = pool.some((passage) => !chosenIds.has(passage.id));

  let notice = aiUsed
    ? "The reflection was written with AI from the verified passage. The verse text is from the World English Bible, Catholic edition, not from the AI."
    : "The reflection was prepared ahead of time from the passage. The verse text is from the World English Bible, Catholic edition.";

  if (themes.general && !crisis) {
    notice = `No specific theme stood out, so these are steadying passages many people read. ${notice}`;
  }

  return {
    ok: true,
    aiUsed,
    generalMatch: themes.general,
    crisis,
    themes: themes.themes,
    support: crisis ? supportNotice() : null,
    results,
    hasMore,
    notice,
  };
}
