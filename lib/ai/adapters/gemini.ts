import {
  AiError,
  type GenerateInput,
  type GenerateResult,
  type ModelAdapter,
} from "../types";
import { AI_CONFIG, AI_FETCH_TIMEOUT_MS } from "../config";

interface GeminiPart {
  text?: string;
}

export const geminiAdapter: ModelAdapter = {
  name: "gemini",
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new AiError("provider_error", "GEMINI_API_KEY missing");

    const model = AI_CONFIG.gemini.model;
    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: input.system }] },
            contents: [{ parts: [{ text: input.user }] }],
            generationConfig: { maxOutputTokens: input.maxTokens ?? 1024 },
          }),
          signal: AbortSignal.any(
            [input.signal, AbortSignal.timeout(AI_FETCH_TIMEOUT_MS)].filter(
              (s): s is AbortSignal => s != null,
            ),
          ),
        },
      );
    } catch (e) {
      // Network failure, DNS error, or timeout — no HTTP response at all.
      // Surface as AiError so the caller fails over to the fallback provider
      // instead of hanging or rejecting with an un-failed-over raw error.
      throw new AiError(
        "provider_error",
        `gemini fetch failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    if (res.status === 429) throw new AiError("rate_limited", "gemini 429");
    // 503 (overload) and other non-OK statuses fail over to the fallback.
    if (!res.ok) throw new AiError("provider_error", `gemini ${res.status}`);

    const json = await res.json();
    const parts: GeminiPart[] =
      json?.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .map((p) => p.text ?? "")
      .join("")
      .trim();

    return { text, provider: "gemini" };
  },
};
