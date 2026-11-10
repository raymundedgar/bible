export type AiProvider = "gemini" | "openai";

export interface AppEnv {
  bibleApiBaseUrl: string;
  bibleTranslationId: string;
  aiEnabled: boolean;
  aiProvider: AiProvider;
  aiApiBaseUrl: string;
  aiApiKey: string;
  aiModel: string;
}

const DEFAULT_BIBLE_API = "https://bible.helloao.org/api";
const DEFAULT_TRANSLATION = "eng_webc";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_FREE_MODEL = "gemini-3.5-flash-lite";

type EnvSource = Record<string, unknown> | undefined;

function readString(sources: EnvSource[], key: string): string {
  for (const source of sources) {
    const value = source?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function resolveEnv(runtimeEnv?: EnvSource): AppEnv {
  const meta = import.meta.env as EnvSource;
  const nodeEnv =
    typeof process !== "undefined" ? (process.env as EnvSource) : undefined;
  const sources = [runtimeEnv, meta, nodeEnv];

  const provider: AiProvider =
    readString(sources, "AI_PROVIDER").toLowerCase() === "openai" ? "openai" : "gemini";
  const aiFlag = readString(sources, "AI_ENABLED").toLowerCase() === "true";
  const configuredBase = readString(sources, "AI_API_BASE_URL").replace(/\/$/, "");
  const configuredModel = readString(sources, "AI_MODEL");
  const geminiKey = readString(sources, "GEMINI_API_KEY") || readString(sources, "AI_API_KEY");
  const openAiKey = readString(sources, "AI_API_KEY");

  const aiApiBaseUrl =
    provider === "gemini" ? configuredBase || GEMINI_API_BASE : configuredBase;
  const aiApiKey = provider === "gemini" ? geminiKey : openAiKey;
  const aiModel = configuredModel || (provider === "gemini" ? GEMINI_FREE_MODEL : "");

  return {
    bibleApiBaseUrl:
      readString(sources, "BIBLE_API_BASE_URL").replace(/\/$/, "") ||
      DEFAULT_BIBLE_API,
    bibleTranslationId:
      readString(sources, "BIBLE_TRANSLATION_ID") || DEFAULT_TRANSLATION,
    aiEnabled: aiFlag && Boolean(aiApiBaseUrl && aiApiKey && aiModel),
    aiProvider: provider,
    aiApiBaseUrl,
    aiApiKey,
    aiModel,
  };
}
