"use server";

import { getSessionUser } from "@/lib/auth";
import { upsertProfile } from "@/lib/data/profile";
import { validateSurveyInput, insertSurvey } from "@/lib/data/survey";
import type { Attitude, Profile } from "@/lib/data/types";

export async function saveOnboardingField(patch: Partial<Profile>): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await upsertProfile(user.id, patch);
}

export async function savePreSurvey(input: {
  usingScore: number;
  trustScore: number;
  attitude: Attitude;
}): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const full = { phase: "pre" as const, ...input };
  const check = validateSurveyInput(full);
  if (!check.ok) throw new Error(check.error);

  await insertSurvey(user.id, full);
  // Mirror the baseline onto the profile for quick reads + the confidence meter.
  await upsertProfile(user.id, {
    confidenceUsing: input.usingScore,
    confidenceTrust: input.trustScore,
    attitude: input.attitude,
  });
}

export async function completeOnboarding(): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await upsertProfile(user.id, { onboardedAt: new Date().toISOString() });
}
