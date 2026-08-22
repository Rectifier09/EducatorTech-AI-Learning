import type { LessonProgress, ProgressStatus } from "@/lib/data/types";

/**
 * Namespaced progress key: progress rows are stored per track under
 * `"<trackId>:<lessonId>"` so multiple tracks share one `progress` table
 * without id collisions (no DB migration needed).
 */
export function progressKey(trackId: string, lessonId: string): string {
  return `${trackId}:${lessonId}`;
}

/**
 * Pure unlock rule, scoped to a single track: lesson `n` is `active` iff
 * lesson `n-1` is `completed`; lesson 1 is `active` by default; completed
 * lessons stay `completed`. Progress is looked up by the namespaced key
 * `"<trackId>:<lessonId>"`; the returned `lessonId` is bare (un-namespaced).
 */
export function deriveLessonStates(
  trackId: string,
  lessonIds: string[],
  progress: Record<string, LessonProgress>,
): { lessonId: string; state: ProgressStatus }[] {
  let prevCompleted = true; // lesson 1 unlocks by default
  return lessonIds.map((lessonId) => {
    const done =
      progress[progressKey(trackId, lessonId)]?.status === "completed";
    let state: ProgressStatus;
    if (done) state = "completed";
    else if (prevCompleted) state = "active";
    else state = "locked";
    prevCompleted = done;
    return { lessonId, state };
  });
}
