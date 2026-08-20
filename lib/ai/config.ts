// Model choice is config, not hard-wired. Swap here (verified 2026-08-21).
export const AI_CONFIG = {
  gemini: { model: "gemini-flash-latest" },
  groq: { model: "openai/gpt-oss-120b" },
  primary: "gemini",
  fallback: "groq",
} as const;
