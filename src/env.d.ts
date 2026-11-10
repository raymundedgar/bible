/// <reference types="astro/client" />

declare module "cloudflare:workers" {
  export const env: Record<string, string | undefined>;
}

interface ImportMetaEnv {
  readonly BIBLE_API_BASE_URL?: string;
  readonly BIBLE_TRANSLATION_ID?: string;
  readonly AI_ENABLED?: string;
  readonly AI_API_BASE_URL?: string;
  readonly AI_API_KEY?: string;
  readonly AI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
