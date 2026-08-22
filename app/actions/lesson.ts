"use server";

import { getSessionUser } from "@/lib/auth";
import { getAllProgress, completeLesson } from "@/lib/data/progress";
import { getUserEvents, logEvent } from "@/lib/data/events";
import {
  computeStreak,
  activeDatesFromEvents,
} from "@/lib/gamification/streak";
import { earnedBadges, type Badge } from "@/lib/gamification/badges";
import { newlyEarnedBadges } from "@/lib/gamification/celebrate";
import { progressKey } from "@/lib/progress/unlock";

export async function finishLesson(
  trackId: string,
  lessonId: string,
  score: number,
): Promise<{ newBadges: Badge[] }> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().slice(0, 10);

  // Snapshot the badge-relevant state *before* recording completion, so the
  // reward screen can surface only what just got newly earned.
  const progressBefore = await getAllProgress(user.id);
  const eventsBefore = await getUserEvents(user.id);
  const streakBefore = computeStreak(
    activeDatesFromEvents(eventsBefore),
    today,
  );
  const badgesBefore = earnedBadges({
    progress: progressBefore,
    events: eventsBefore,
    streakCurrent: streakBefore.current,
  });

  await completeLesson(user.id, trackId, lessonId, score);
  await logEvent("lesson_completed", { trackId, lessonId, score });

  // Recompute the same values with this lesson's completion applied, without
  // a second round-trip: completeLesson always sets status "completed", and
  // the event we just logged is the only new one.
  const key = progressKey(trackId, lessonId);
  const progressAfter = {
    ...progressBefore,
    [key]: { ...progressBefore[key], status: "completed" as const },
  };
  const eventsAfter: { name: string; createdAt: string }[] = [
    ...eventsBefore.map((e) => ({ name: e.name, createdAt: e.createdAt })),
    { name: "lesson_completed", createdAt: new Date().toISOString() },
  ];
  const streakAfter = computeStreak(activeDatesFromEvents(eventsAfter), today);
  const badgesAfter = earnedBadges({
    progress: progressAfter,
    events: eventsAfter,
    streakCurrent: streakAfter.current,
  });

  return { newBadges: newlyEarnedBadges(badgesBefore, badgesAfter) };
}

/** Fire-and-forget drop-off signal: emitted once when a lesson opens. */
export async function logLessonStarted(
  trackId: string,
  lessonId: string,
): Promise<void> {
  await logEvent("lesson_started", { trackId, lessonId });
}

export async function logConfidenceCheck(
  trackId: string,
  lessonId: string,
  blockId: string,
  value: number,
): Promise<void> {
  await logEvent("confidence_check", { trackId, lessonId, blockId, value });
}
