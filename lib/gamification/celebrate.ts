import type { Badge } from "@/lib/gamification/badges";

/** Badges present in `after` but not in `before`, matched by `id`. */
export function newlyEarnedBadges(before: Badge[], after: Badge[]): Badge[] {
  const had = new Set(before.map((b) => b.id));
  return after.filter((b) => !had.has(b.id));
}

/** True when at least one threshold sits strictly between prevXp and nextXp. */
export function didLevelUp(
  prevXp: number,
  nextXp: number,
  thresholds: number[],
): boolean {
  return thresholds.some((t) => prevXp < t && nextXp >= t);
}
