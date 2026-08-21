import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLesson, getTrack, nextLessonId } from "@/lib/content/loader";
import { getAllProgress } from "@/lib/data/progress";
import { getProfile } from "@/lib/data/profile";
import { getLatestArtifact } from "@/lib/data/toolkit";
import { deriveLessonStates } from "@/lib/progress/unlock";
import { tonePrefs } from "@/lib/adaptive/tone";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!getTrack().lessonIds.includes(id)) notFound();

  // Guard: the lesson must be unlocked for this user.
  const progress = await getAllProgress(user.id);
  const states = deriveLessonStates(getTrack().lessonIds, progress);
  const state = states.find((s) => s.lessonId === id)?.state;
  if (state === "locked") redirect("/path");

  const lesson = getLesson(id);
  const profile = await getProfile(user.id);
  const initialSpine = (await getLatestArtifact(user.id)) ?? undefined;

  return (
    <LessonPlayer
      lesson={lesson}
      nextId={nextLessonId(id)}
      initialSpine={initialSpine}
      showGoDeeper={tonePrefs(profile?.attitude ?? "curious").showGoDeeper}
      profile={{
        subject: profile?.subject ?? null,
        gradeBand: profile?.gradeBand ?? null,
      }}
    />
  );
}
