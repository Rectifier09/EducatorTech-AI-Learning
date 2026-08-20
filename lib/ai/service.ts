import {
  AiError,
  type GenerateInput,
  type GenerateResult,
  type ModelAdapter,
} from "./types";
import { geminiAdapter } from "./adapters/gemini";

/** Wraps a single adapter; treats blank output as an error. */
export function makeService(adapter: ModelAdapter) {
  return async (input: GenerateInput): Promise<GenerateResult> => {
    const result = await adapter.generate(input);
    if (!result.text || result.text.trim().length === 0) {
      throw new AiError("empty");
    }
    return result;
  };
}

// Failover (Gemini → Groq) is added in Task 2; default binds to Gemini for now.
export const generate = makeService(geminiAdapter);
