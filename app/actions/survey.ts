"use server";

import { getSessionUser } from "@/lib/auth";
import { insertSurvey, getSurveys, type SurveyScores } from "@/lib/data/survey";
import { logEvent } from "@/lib/data/events";
import { confidenceDelta, type ConfidenceDelta } from "@/lib/measurement/delta";
import type { Attitude } from "@/lib/data/types";

export async function savePostSurvey(input: {
  usingScore: number;
  trustScore: number;
  attitude: Attitude;
}): Promise<{
  pre: SurveyScores | null;
  post: SurveyScores;
  delta: ConfidenceDelta | null;
}> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const { pre } = await getSurveys(user.id);
  await insertSurvey(user.id, { phase: "post", ...input });
  await logEvent("post_survey_completed", {});

  const post: SurveyScores = {
    usingScore: input.usingScore,
    trustScore: input.trustScore,
    attitude: input.attitude,
  };
  return { pre, post, delta: pre ? confidenceDelta(pre, post) : null };
}
