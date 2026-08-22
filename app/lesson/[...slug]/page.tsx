import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  getLesson,
  getTrack,
  nextLessonId,
  trackExists,
  FOUNDATIONS_TRACK_ID,
} from "@/lib/content/loader";
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
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  // Legacy single-segment URLs (`/lesson/l1`) predate multi-track routing;
  // redirect them into the foundations track so old links keep working.
  if (slug.length === 1) {
    redirect(`/lesson/${FOUNDATIONS_TRACK_ID}/${slug[0]}`);
  }
  if (slug.length !== 2) notFound();

  const [trackId, lessonId] = slug;

  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!trackExists(trackId)) notFound();
  const track = getTrack(trackId);
  if (!track.lessonIds.includes(lessonId)) notFound();

  // Guard: the lesson must be unlocked for this user within its track.
  const progress = await getAllProgress(user.id);
  const states = deriveLessonStates(trackId, track.lessonIds, progress);
  const state = states.find((s) => s.lessonId === lessonId)?.state;
  if (state === "locked") redirect("/learn");

  const lesson = getLesson(trackId, lessonId);
  const profile = await getProfile(user.id);
  const initialSpine = (await getLatestArtifact(user.id)) ?? undefined;

  const next = nextLessonId(trackId, lessonId);
  const nextHref = next ? `/lesson/${trackId}/${next}` : null;

  return (
    <LessonPlayer
      lesson={lesson}
      trackId={trackId}
      nextHref={nextHref}
      initialSpine={initialSpine}
      showGoDeeper={tonePrefs(profile?.attitude ?? "curious").showGoDeeper}
      profile={{
        subject: profile?.subject ?? null,
        gradeBand: profile?.gradeBand ?? null,
      }}
    />
  );
}
