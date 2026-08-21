"use server";

import { getSessionUser } from "@/lib/auth";
import { saveCommitment, recordOutcome } from "@/lib/data/commitments";
import { logEvent } from "@/lib/data/events";

export async function commitToUse(useOn: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await saveCommitment(user.id, useOn);
  await logEvent("class_commitment", { useOn });
}

export async function answerFollowUp(
  id: string,
  outcome: "used" | "not",
): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await recordOutcome(id, outcome);
  await logEvent("class_followup", { outcome });
}
