"use server";

import { getSessionUser } from "@/lib/auth";
import { getProfile, upsertProfile } from "@/lib/data/profile";
import { generateReferralCode } from "@/lib/referral/code";
import { logEvent } from "@/lib/data/events";

/** Returns the caller's existing referral code, generating one on first use. */
export async function getOrCreateReferralCode(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const existing = await getProfile(user.id);
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const updated = await upsertProfile(user.id, {
        referralCode: generateReferralCode(),
      });
      if (updated.referralCode) return updated.referralCode;
    } catch {
      // Unique-constraint collision — practically never at 8 random
      // characters, but retry once rather than fail outright.
    }
  }
  throw new Error("Could not generate a referral code");
}

export async function logReferralShare(): Promise<void> {
  await logEvent("referral_link_shared");
}
