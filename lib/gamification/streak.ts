function prevDay(d: string): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Forgiving streak: +1 per active day walking back from `today`; a single
 * missed day is bridged by one freeze; two consecutive missed days stop it.
 * `activeDates` and `today` are YYYY-MM-DD.
 */
export function computeStreak(
  activeDates: string[],
  today: string,
): { current: number; freezeUsed: boolean } {
  const active = new Set(activeDates);
  let current = 0;
  let freezeUsed = false;
  let cursor = today;

  while (true) {
    if (active.has(cursor)) {
      current++;
      cursor = prevDay(cursor);
      continue;
    }
    // missing day — try one freeze to bridge a single gap
    if (!freezeUsed && current > 0) {
      const before = prevDay(cursor);
      if (active.has(before)) {
        freezeUsed = true;
        cursor = before;
        continue;
      }
    }
    break;
  }

  return { current, freezeUsed };
}

/** Distinct local activity dates (YYYY-MM-DD) from event timestamps. */
export function activeDatesFromEvents(
  events: { createdAt: string }[],
): string[] {
  return Array.from(
    new Set(events.map((e) => e.createdAt.slice(0, 10))),
  );
}
