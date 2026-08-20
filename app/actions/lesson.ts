"use server";

import { getSessionUser } from "@/lib/auth";
import { completeLesson } from "@/lib/data/progress";
import { logEvent } from "@/lib/data/events";

export async function finishLesson(
  lessonId: string,
  score: number,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await completeLesson(user.id, lessonId, score);
  await logEvent("lesson_completed", { lessonId, score });
}
