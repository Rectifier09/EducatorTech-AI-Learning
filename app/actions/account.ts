"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Permanently and irreversibly delete the CURRENT user's account and all their
 * data. The user id comes only from the server-side session — never from the
 * client — so a caller can only ever delete themselves.
 *
 * Deleting the auth user cascades every personal table (profiles,
 * survey_responses, progress, playground_sessions, notify_requests,
 * class_commitments — all ON DELETE CASCADE). Analytics `events` are
 * ON DELETE SET NULL, so they are intentionally RETAINED but de-identified
 * (user_id nulled) — no personal link remains, and the pilot funnel is kept.
 */
export async function deleteAccount(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Delete the auth user — cascades all personal tables; events are
  // de-identified (user_id set to null) rather than deleted.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`Account deletion failed: ${error.message}`);
  }

  // Clear the now-orphaned session cookies, then leave.
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
