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

export interface SurveyScores {
  usingScore: number;
  trustScore: number;
  attitude: Attitude;
}

export async function getSurveys(
  userId: string,
): Promise<{ pre: SurveyScores | null; post: SurveyScores | null }> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("survey_responses")
    .select("phase,using_score,trust_score,attitude")
    .eq("user_id", userId);

  const rows = (data ?? []) as {
    phase: SurveyPhase;
    using_score: number;
    trust_score: number;
    attitude: Attitude;
  }[];
  const map = (phase: SurveyPhase): SurveyScores | null => {
    const r = rows.find((x) => x.phase === phase);
    return r
      ? { usingScore: r.using_score, trustScore: r.trust_score, attitude: r.attitude }
      : null;
  };
  return { pre: map("pre"), post: map("post") };
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
