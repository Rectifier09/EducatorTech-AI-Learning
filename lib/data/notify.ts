export async function requestNotify(
  userId: string,
  nodeId: string,
): Promise<void> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  await supabase
    .from("notify_requests")
    .upsert({ user_id: userId, node_id: nodeId });
}

export async function getNotifiedNodes(userId: string): Promise<string[]> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("notify_requests")
    .select("node_id")
    .eq("user_id", userId);
  return ((data ?? []) as { node_id: string }[]).map((r) => r.node_id);
}
