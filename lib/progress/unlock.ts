import type { LessonProgress, ProgressStatus } from "@/lib/data/types";

/**
 * Pure unlock rule: lesson `n` is `active` iff lesson `n-1` is `completed`;
 * lesson 1 is `active` by default; completed lessons stay `completed`.
 */
export function deriveLessonStates(
  lessonIds: string[],
  progress: Record<string, LessonProgress>,
): { lessonId: string; state: ProgressStatus }[] {
  let prevCompleted = true; // lesson 1 unlocks by default
  return lessonIds.map((lessonId) => {
    const done = progress[lessonId]?.status === "completed";
    let state: ProgressStatus;
    if (done) state = "completed";
    else if (prevCompleted) state = "active";
    else state = "locked";
    prevCompleted = done;
    return { lessonId, state };
  });
}
