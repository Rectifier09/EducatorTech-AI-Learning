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
 * class_commitments — all ON DELETE CASCADE). `events` are ON DELETE SET NULL,
 * so we remove them explicitly first for a complete erasure.
 */
export async function deleteAccount(): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Erase analytics events while the user_id link still exists.
  const { error: eventsError } = await admin
    .from("events")
    .delete()
    .eq("user_id", user.id);
  if (eventsError) {
    throw new Error(`Account deletion failed (events): ${eventsError.message}`);
  }

  // Delete the auth user — cascades all remaining personal tables.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`Account deletion failed: ${error.message}`);
  }

  // Clear the now-orphaned session cookies, then leave.
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
