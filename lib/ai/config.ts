// Model choice is config, not hard-wired. Swap here (verified 2026-08-21).
export const AI_CONFIG = {
  gemini: { model: "gemini-flash-latest" },
  groq: { model: "openai/gpt-oss-120b" },
  primary: "gemini",
  fallback: "groq",
} as const;

// Per-provider fetch timeout. Without this, a stalled upstream connection
// hangs the request until Vercel's hard 300s function limit — no failover,
// no error, just a spinner. Well under that limit so the fallback provider
// still has time to respond within the same request.
export const AI_FETCH_TIMEOUT_MS = 20_000;
