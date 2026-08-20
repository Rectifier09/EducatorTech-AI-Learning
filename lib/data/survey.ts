import type { Attitude, SurveyPhase } from "./types";

const ATTITUDES: readonly Attitude[] = [
  "excited",
  "curious",
  "cautious",
  "skeptical",
];

export interface SurveyInput {
  phase: SurveyPhase;
  usingScore: number;
  trustScore: number;
  attitude: Attitude;
}

export function validateSurveyInput(
  input: SurveyInput,
): { ok: true } | { ok: false; error: string } {
  const inRange = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;
  if (!inRange(input.usingScore))
    return { ok: false, error: "usingScore must be an integer 1–5" };
  if (!inRange(input.trustScore))
    return { ok: false, error: "trustScore must be an integer 1–5" };
  if (!ATTITUDES.includes(input.attitude))
    return { ok: false, error: "invalid attitude" };
  return { ok: true };
}

export async function insertSurvey(
  userId: string,
  input: SurveyInput,
): Promise<void> {
  // Lazy import keeps validateSurveyInput unit-testable without next/headers.
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { error } = await supabase.from("survey_responses").insert({
    user_id: userId,
    phase: input.phase,
    using_score: input.usingScore,
    trust_score: input.trustScore,
    attitude: input.attitude,
  });
  if (error) throw error;
}
