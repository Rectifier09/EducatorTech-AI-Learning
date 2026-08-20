"use server";

import { getSessionUser } from "@/lib/auth";
import { upsertProfile } from "@/lib/data/profile";

export async function setAlias(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  const alias = String(formData.get("alias") ?? "")
    .trim()
    .slice(0, 20);
  await upsertProfile(user.id, { alias: alias || null });
}
