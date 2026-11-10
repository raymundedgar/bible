import { buildAiUserMessage, AI_SYSTEM_PROMPT } from "./prompt";

export interface AiPassageInput {
  reference: string;
  text: string;
  contextNote: string;
}

export class AiProviderError extends Error {
  status: number;

  constructor(status: number) {
    super("ai_provider_error");
    this.name = "AiProviderError";
    this.status = status;
  }
}

function parseContent(content: string): unknown {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed) as unknown;
}

function geminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const parts = (
    payload as {
      candidates?: { content?: { parts?: { text?: unknown; thought?: boolean }[] } }[];
    }
  ).candidates?.[0]?.content?.parts;
  if (!parts) return "";
  return parts
    .filter((part) => part.thought !== true && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
}

async function completeGemini(options: {
  baseUrl: string;
  apiKey: string;
  model: string;
  situation: string;
  passages: AiPassageInput[];
  fetchImpl: typeof fetch;
  jsonMode: boolean;
}): Promise<unknown> {
  const generationConfig: Record<string, unknown> = {
    temperature: 0.3,
    maxOutputTokens: 1024,
    thinkingConfig: { thinkingLevel: "minimal" },
  };
  if (options.jsonMode) generationConfig.responseMimeType = "application/json";

  const response = await options.fetchImpl(
    `${options.baseUrl}/models/${options.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [{ text: buildAiUserMessage(options.situation, options.passages) }],
          },
        ],
        generationConfig,
      }),
      signal: AbortSignal.timeout(12000),
    },
  );

  if (!response.ok) throw new AiProviderError(response.status);
  const text = geminiText(await response.json());
  if (!text.trim()) throw new AiProviderError(502);
  try {
    return parseContent(text);
  } catch {
    throw new AiProviderError(502);
  }
}

async function complete(options: {
  baseUrl: string;
  apiKey: string;
  model: string;
  situation: string;
  passages: AiPassageInput[];
  fetchImpl: typeof fetch;
  jsonMode: boolean;
}): Promise<unknown> {
  const body: Record<string, unknown> = {
    model: options.model,
    temperature: 0.3,
    max_tokens: 900,
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildAiUserMessage(options.situation, options.passages),
      },
    ],
  };
  if (options.jsonMode) body.response_format = { type: "json_object" };

  const response = await options.fetchImpl(`${options.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) throw new AiProviderError(response.status);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") throw new AiProviderError(502);
  const content = (payload as { choices?: { message?: { content?: unknown } }[] })
    .choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new AiProviderError(502);
  try {
    return parseContent(content);
  } catch {
    throw new AiProviderError(502);
  }
}

export async function requestExplanations(options: {
  provider?: "gemini" | "openai";
  baseUrl: string;
  apiKey: string;
  model: string;
  situation: string;
  passages: AiPassageInput[];
  fetchImpl?: typeof fetch;
}): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const run = options.provider === "gemini" ? completeGemini : complete;
  try {
    return await run({ ...options, fetchImpl, jsonMode: true });
  } catch (error) {
    if (error instanceof AiProviderError && error.status === 400) {
      return run({ ...options, fetchImpl, jsonMode: false });
    }
    throw error;
  }
}
