export const MANUAL_MINUTES: Record<string, number> = {
  Worksheet: 30,
  Quiz: 20,
  "Lesson-plan outline": 40,
  "Activity idea": 15,
};

const DEFAULT_MINUTES = 20;

export function totalMinutesSaved(
  sessions: { artifactType: string | null }[],
): number {
  return sessions.reduce(
    (sum, s) =>
      sum + (s.artifactType ? (MANUAL_MINUTES[s.artifactType] ?? DEFAULT_MINUTES) : DEFAULT_MINUTES),
    0,
  );
}

export function formatHoursSaved(minutes: number): string {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `~${hours} hour${hours === 1 ? "" : "s"}`;
}
