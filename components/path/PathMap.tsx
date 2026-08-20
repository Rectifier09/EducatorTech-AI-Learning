import { deriveLessonStates } from "@/lib/progress/unlock";
import { LessonNode } from "./LessonNode";
import type { Lesson } from "@/lib/content/types";
import type { LessonProgress } from "@/lib/data/types";

export function PathMap({
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
    <div className="flex flex-col">
      {states.map((s, i) => {
        const lesson = byId.get(s.lessonId);
        if (!lesson) return null;
        return (
          <div key={s.lessonId}>
            <LessonNode
              id={s.lessonId}
              title={lesson.title}
              estMinutes={lesson.estMinutes}
              state={s.state}
            />
            {i < states.length - 1 && (
              <div className="ml-6 h-4 w-0.5 bg-line-2" />
            )}
          </div>
        );
      })}
    </div>
  );
}
