"use server";

import { getSessionUser } from "@/lib/auth";
import { requestNotify as saveNotify } from "@/lib/data/notify";
import { logEvent } from "@/lib/data/events";

export async function requestNotify(nodeId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await saveNotify(user.id, nodeId);
  await logEvent("notify_requested", { nodeId });
}
