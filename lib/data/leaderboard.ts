import { createAdminClient } from "@/lib/supabase/admin";
import { XP_RULES } from "@/lib/gamification/xp";
import { weekStart, assignLeagues, rankLeague } from "@/lib/gamification/leagues";

export interface LeagueMember {
  userId: string;
  name: string;
  weeklyXp: number;
  rank: number;
  isYou: boolean;
}

export async function getMyLeague(userId: string): Promise<LeagueMember[]> {
  const admin = createAdminClient();
  const ws = weekStart(new Date());

  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, alias, display_name");
  const rows = (profiles ?? []) as {
    user_id: string;
    alias: string | null;
    display_name: string | null;
  }[];
  if (rows.length === 0) return [];

  const { data: events } = await admin
    .from("events")
    .select("user_id, name, created_at")
    .gte("created_at", ws.toISOString())
    .order("created_at", { ascending: true });

  const xpByUser = new Map<string, number>();
  const firstByUser = new Map<string, string>();
  for (const e of (events ?? []) as {
    user_id: string;
    name: string;
    created_at: string;
  }[]) {
    const pts = XP_RULES[e.name] ?? 0;
    if (pts === 0) continue;
    xpByUser.set(e.user_id, (xpByUser.get(e.user_id) ?? 0) + pts);
    if (!firstByUser.has(e.user_id)) firstByUser.set(e.user_id, e.created_at);
  }

  const leagues = assignLeagues(
    rows.map((r) => ({ userId: r.user_id })),
    12,
  );
  const mine = leagues.find((l) => l.includes(userId)) ?? [userId];

  const ranked = rankLeague(
    mine.map((uid) => ({
      userId: uid,
      weeklyXp: xpByUser.get(uid) ?? 0,
      firstReachedAt: firstByUser.get(uid) ?? "9999",
    })),
  );

  const nameOf = (uid: string): string => {
    const p = rows.find((r) => r.user_id === uid);
    return p?.alias || p?.display_name?.split(" ")[0] || "A teacher";
  };

  return ranked.map((r) => ({
    userId: r.userId,
    name: nameOf(r.userId),
    weeklyXp: xpByUser.get(r.userId) ?? 0,
    rank: r.rank,
    isYou: r.userId === userId,
  }));
}
