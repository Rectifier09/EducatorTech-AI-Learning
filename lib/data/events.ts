import type { AppEvent } from "./types";

/** All of a user's events, oldest first. */
export async function getUserEvents(userId: string): Promise<AppEvent[]> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("events")
    .select("name,props,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return (
    (data ?? []) as { name: string; props: Record<string, unknown>; created_at: string }[]
  ).map((r) => ({
    userId,
    name: r.name,
    props: r.props ?? {},
    createdAt: r.created_at,
  }));
}

/**
 * Fire-and-forget analytics event. NEVER throws — analytics must not break the
 * app. Lazy imports keep this unit-testable without next/headers.
 */
export async function logEvent(
  name: string,
  props: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { createServerClient } = await import("@/lib/supabase/server");
    const { getSessionUser } = await import("@/lib/auth");
    const user = await getSessionUser();
    const supabase = await createServerClient();
    await supabase
      .from("events")
      .insert({ user_id: user?.id ?? null, name, props });
  } catch (e) {
    console.error("logEvent failed:", e);
  }
}
