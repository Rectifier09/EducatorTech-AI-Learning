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

export interface DayActivity {
  /** YYYY-MM-DD (UTC), matching the streak's date space. */
  date: string;
  active: boolean;
  isToday: boolean;
  /** Single-letter weekday (S M T W T F S), derived from the UTC date. */
  label: string;
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * The trailing `days`-day window ending on `today`, oldest → newest (today
 * last), each marked active if it appears in `activeDates`. UTC throughout so
 * the row agrees with `computeStreak`. Deterministic from its string inputs,
 * so it is safe to compute server-side and render without hydration drift.
 */
export function weekActivity(
  activeDates: string[],
  today: string,
  days = 7,
): DayActivity[] {
  const active = new Set(activeDates);
  const out: DayActivity[] = [];
  let cursor = today;
  for (let i = 0; i < days; i++) {
    const dow = new Date(cursor + "T00:00:00Z").getUTCDay();
    out.push({
      date: cursor,
      active: active.has(cursor),
      isToday: cursor === today,
      label: WEEKDAY_INITIALS[dow],
    });
    cursor = prevDay(cursor);
  }
  return out.reverse();
}
