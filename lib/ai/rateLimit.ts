export function remainingFrom(
  count: number,
  limit: number,
): { allowed: boolean; remaining: number } {
  return { allowed: count < limit, remaining: Math.max(0, limit - count) };
}

export const DAILY_LIMIT = 30;

/** Counts today's ai_generate events for the user against the daily limit. */
export async function checkRateLimit(
  userId: string,
  limit: number = DAILY_LIMIT,
): Promise<{ allowed: boolean; remaining: number }> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("name", "ai_generate")
    .gte("created_at", since.toISOString());

  return remainingFrom(count ?? 0, limit);
}
