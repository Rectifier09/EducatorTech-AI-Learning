import {
  AiError,
  type GenerateInput,
  type GenerateResult,
  type ModelAdapter,
} from "../types";
import { AI_CONFIG } from "../config";

export const groqAdapter: ModelAdapter = {
  name: "groq",
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new AiError("provider_error", "GROQ_API_KEY missing");

    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_CONFIG.groq.model,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.user },
          ],
          max_tokens: input.maxTokens ?? 1024,
        }),
      },
    );

    if (res.status === 429) throw new AiError("rate_limited", "groq 429");
    if (!res.ok) throw new AiError("provider_error", `groq ${res.status}`);

    const json = await res.json();
    const raw: string = json?.choices?.[0]?.message?.content ?? "";
    // Strip any reasoning tags some open models emit inline.
    const text = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return { text, provider: "groq" };
  },
};
