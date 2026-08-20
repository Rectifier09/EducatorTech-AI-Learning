"use server";

import { getSessionUser } from "@/lib/auth";
import { upsertProfile } from "@/lib/data/profile";
import type { Profile } from "@/lib/data/types";

export async function saveOnboardingField(patch: Partial<Profile>): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await upsertProfile(user.id, patch);
}

export async function completeOnboarding(): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await upsertProfile(user.id, { onboardedAt: new Date().toISOString() });
}
