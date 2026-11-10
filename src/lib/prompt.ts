export const MAX_PROMPT_LENGTH = 1500;
export const MIN_PROMPT_LENGTH = 3;

export type PromptResult =
  | { ok: true; text: string }
  | { ok: false; message: string };

export function validatePrompt(input: unknown): PromptResult {
  if (typeof input !== "string") {
    return {
      ok: false,
      message: "Write a few words about what is happening, then try again.",
    };
  }

  const text = input.trim();
  if (text.length < MIN_PROMPT_LENGTH) {
    return {
      ok: false,
      message: "Write a few words about what is happening, then try again.",
    };
  }

  if (text.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      message: `Please shorten your message to ${MAX_PROMPT_LENGTH.toLocaleString("en-US")} characters or fewer.`,
    };
  }

  return { ok: true, text };
}

const passageIdPattern = /^[A-Z0-9]{2,4}\.\d{1,3}\.\d{1,3}(-\d{1,3})?$/;

export function sanitizeExclude(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const ids: string[] = [];
  for (const value of input) {
    if (typeof value !== "string") continue;
    const id = value.trim();
    if (!passageIdPattern.test(id)) continue;
    if (!ids.includes(id)) ids.push(id);
    if (ids.length === 12) break;
  }
  return ids;
}
