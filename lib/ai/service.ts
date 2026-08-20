import {
  AiError,
  type GenerateInput,
  type GenerateResult,
  type ModelAdapter,
} from "./types";
import { geminiAdapter } from "./adapters/gemini";
import { groqAdapter } from "./adapters/groq";

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

/** Tries the primary; on any AiError, falls back once to the secondary. */
export function makeFailoverService(
  primary: ModelAdapter,
  fallback: ModelAdapter,
) {
  const primaryGen = makeService(primary);
  const fallbackGen = makeService(fallback);
  return async (input: GenerateInput): Promise<GenerateResult> => {
    try {
      return await primaryGen(input);
    } catch (e) {
      if (e instanceof AiError) {
        return await fallbackGen(input);
      }
      throw e;
    }
  };
}

/** Default: Gemini primary, Groq fallback. Swap in lib/ai/config.ts. */
export const generate = makeFailoverService(geminiAdapter, groqAdapter);
