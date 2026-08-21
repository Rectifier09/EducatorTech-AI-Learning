import { deriveLessonStates } from "@/lib/progress/unlock";
import { JourneyRow } from "./JourneyRow";
import type { Lesson } from "@/lib/content/types";
import type { LessonProgress } from "@/lib/data/types";

export function JourneyList({
  lessons,
  progress,
}: {
  lessons: Lesson[];
  progress: Record<string, LessonProgress>;
}) {
  const states = deriveLessonStates(
    lessons.map((l) => l.id),
    progress,
  );
  const byId = new Map(lessons.map((l) => [l.id, l]));

  return (
    <div className="flex flex-col gap-3">
      {states.map((s) => {
        const lesson = byId.get(s.lessonId);
        if (!lesson) return null;
        return (
          <JourneyRow
            key={s.lessonId}
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
