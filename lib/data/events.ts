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
