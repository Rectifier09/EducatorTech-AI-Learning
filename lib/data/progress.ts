import { createServerClient } from "@/lib/supabase/server";
import type { LessonProgress, ProgressStatus } from "./types";

interface ProgressRow {
  user_id: string;
  lesson_id: string;
  status: ProgressStatus;
  score: number | null;
  attempts: number;
  completed_at: string | null;
}

function rowToProgress(row: ProgressRow): LessonProgress {
  return {
    userId: row.user_id,
    lessonId: row.lesson_id,
    status: row.status,
    score: row.score,
    attempts: row.attempts,
    completedAt: row.completed_at,
  };
}

export async function getAllProgress(
  userId: string,
): Promise<Record<string, LessonProgress>> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", userId);
  const out: Record<string, LessonProgress> = {};
  for (const row of (data ?? []) as ProgressRow[]) {
    out[row.lesson_id] = rowToProgress(row);
  }
  return out;
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  score: number,
): Promise<void> {
  const supabase = await createServerClient();
  const { data: existing } = await supabase
    .from("progress")
    .select("attempts")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  const attempts = ((existing?.attempts as number | undefined) ?? 0) + 1;

  const { error } = await supabase.from("progress").upsert({
    user_id: userId,
    lesson_id: lessonId,
    status: "completed",
    score,
    attempts,
    completed_at: new Date().toISOString(),
  });
  if (error) throw error;
}
