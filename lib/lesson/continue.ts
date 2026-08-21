import type { ProgressStatus } from "@/lib/data/types";

interface LessonState {
  lessonId: string;
  state: ProgressStatus;
}

/**
 * The lesson id to send "Continue" to: the first `active` lesson, else the
 * first `locked` one, else null when every lesson is `completed`.
 */
export function nextLessonTarget(states: LessonState[]): string | null {
  return (
    (states.find((s) => s.state === "active") ??
      states.find((s) => s.state === "locked"))?.lessonId ?? null
  );
}
