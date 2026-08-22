import { JourneyRow } from "./JourneyRow";
import type { Lesson } from "@/lib/content/types";
import type { LessonState } from "./LearnHome";

export function JourneyList({
  trackId,
  lessons,
  states,
}: {
  trackId: string;
  lessons: Lesson[];
  /** Precomputed (in the server page) track-aware unlock states. */
  states: LessonState[];
}) {
  const byId = new Map(lessons.map((l) => [l.id, l]));

  return (
    <div className="flex flex-col gap-3">
      {states.map((s) => {
        const lesson = byId.get(s.lessonId);
        if (!lesson) return null;
        return (
          <JourneyRow
            key={s.lessonId}
            trackId={trackId}
            id={s.lessonId}
            title={lesson.title}
            estMinutes={lesson.estMinutes}
            state={s.state}
          />
        );
      })}
    </div>
  );
}
