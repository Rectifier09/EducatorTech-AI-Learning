export function weekStart(today: Date): Date {
  const d = new Date(today);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const daysSinceMonday = (day + 6) % 7;
  d.setDate(d.getDate() - daysSinceMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Deterministic small leagues (stable by userId), each ≤ `size`. */
export function assignLeagues(
  users: { userId: string }[],
  size = 12,
): string[][] {
  const sorted = users.map((u) => u.userId).sort();
  const out: string[][] = [];
  for (let i = 0; i < sorted.length; i += size) {
    out.push(sorted.slice(i, i + size));
  }
  return out;
}

export function rankLeague(
  members: { userId: string; weeklyXp: number; firstReachedAt: string }[],
): { userId: string; rank: number }[] {
  return [...members]
    .sort(
      (a, b) =>
        b.weeklyXp - a.weeklyXp ||
        a.firstReachedAt.localeCompare(b.firstReachedAt),
    )
    .map((m, i) => ({ userId: m.userId, rank: i + 1 }));
}
