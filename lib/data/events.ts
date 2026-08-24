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
  let userId: string | null = null;
  try {
    const { createServerClient } = await import("@/lib/supabase/server");
    const { getSessionUser } = await import("@/lib/auth");
    const user = await getSessionUser();
    userId = user?.id ?? null;
    const supabase = await createServerClient();
    await supabase
      .from("events")
      .insert({ user_id: userId, name, props });
  } catch (e) {
    console.error("logEvent failed:", e);
  }

  // Mirror to Mixpanel (server-side, PII-free — distinct_id is the opaque
  // user UUID). Independent try/catch: a Mixpanel failure must never affect
  // the primary Supabase write above, and vice versa.
  if (userId) {
    try {
      const { trackServer } = await import("@/lib/analytics/mixpanel-server");
      await trackServer(name, userId, props);
    } catch (e) {
      console.error("trackServer mirror failed:", e);
    }
  }
}
