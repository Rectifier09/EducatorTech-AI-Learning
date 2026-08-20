import type { AppEvent } from "@/lib/data/types";

export const XP_RULES: Record<string, number> = {
  lesson_completed: 50,
  artifact_saved: 20,
  slip_caught: 15,
  exercise_passed: 10,
  confidence_check: 5,
};

export function computeXp(events: Pick<AppEvent, "name">[]): number {
  return events.reduce((sum, e) => sum + (XP_RULES[e.name] ?? 0), 0);
}

export function weeklyXp(
  events: Pick<AppEvent, "name" | "createdAt">[],
  weekStart: Date,
): number {
  const cutoff = weekStart.getTime();
  return computeXp(events.filter((e) => new Date(e.createdAt).getTime() >= cutoff));
}
