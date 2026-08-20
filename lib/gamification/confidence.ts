interface Survey {
  usingScore: number;
  trustScore: number;
}

function toPct(s: Survey): number {
  return Math.round((((s.usingScore + s.trustScore) / 2) / 5) * 100);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * 0–100 AI Confidence Meter. Seeded from the pre-survey, grown by activity,
 * and — once the capstone post-survey exists — re-anchored to it so the final
 * number stays honest rather than activity-inflated.
 */
export function computeConfidence(input: {
  preSurvey: Survey | null;
  confidenceChecks?: number;
  lessonsCompleted?: number;
  postSurvey?: Survey | null;
}): number {
  if (input.postSurvey) return clamp(toPct(input.postSurvey));

  const base = input.preSurvey ? toPct(input.preSurvey) : 20;
  const growth =
    (input.lessonsCompleted ?? 0) * 6 + (input.confidenceChecks ?? 0) * 2;
  return clamp(base + growth);
}
