import { isFollowUpDue } from "@/lib/followup/due";

export async function saveCommitment(
  userId: string,
  useOn: string,
): Promise<void> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  await supabase
    .from("class_commitments")
    .insert({ user_id: userId, use_on: useOn });
}

export async function getDueFollowUp(
  userId: string,
  today: string,
): Promise<{ id: string; useOn: string } | null> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("class_commitments")
    .select("id, use_on")
    .eq("user_id", userId)
    .eq("followed_up", false)
    .order("use_on", { ascending: true });
  const due = ((data ?? []) as { id: string; use_on: string }[]).find((c) =>
    isFollowUpDue(c.use_on, today),
  );
  return due ? { id: due.id, useOn: due.use_on } : null;
}

export async function recordOutcome(
  id: string,
  outcome: "used" | "not",
): Promise<void> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  await supabase
    .from("class_commitments")
    .update({ followed_up: true, outcome })
    .eq("id", id);
}
