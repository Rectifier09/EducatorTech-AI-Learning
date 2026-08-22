import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getAllLessons } from "@/lib/content/loader";
import { getAllProgress } from "@/lib/data/progress";
import { getUserEvents } from "@/lib/data/events";
import { getSurveys } from "@/lib/data/survey";
import { computeXp } from "@/lib/gamification/xp";
import {
  computeStreak,
  activeDatesFromEvents,
  weekActivity,
} from "@/lib/gamification/streak";
import { computeConfidence } from "@/lib/gamification/confidence";
import { getDueFollowUp } from "@/lib/data/commitments";
import { getSkillTree } from "@/lib/content/skilltree";
import { getNotifiedNodes } from "@/lib/data/notify";
import { deriveLessonStates } from "@/lib/progress/unlock";
import { nextLessonTarget } from "@/lib/lesson/continue";
import { LearnHome } from "@/components/learn/LearnHome";

export const dynamic = "force-dynamic";

/**
 * India-focused pilot: greet by time-of-day in Asia/Kolkata regardless of
 * the server's own timezone, computed server-side to avoid a client/server
 * hydration mismatch.
 */
function timeOfDayGreeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Kolkata",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function LearnPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const first = user.name?.split(" ")[0] ?? "there";
  const lessons = getAllLessons();
  const progress = await getAllProgress(user.id);
  const events = await getUserEvents(user.id);
  const surveys = await getSurveys(user.id);
  const tree = getSkillTree();
  const notified = await getNotifiedNodes(user.id);

  const completed = Object.values(progress).filter(
    (p) => p.status === "completed",
  ).length;
  const xp = computeXp(events);
  const today = new Date().toISOString().slice(0, 10);
  const activeDates = activeDatesFromEvents(events);
  const streak = computeStreak(activeDates, today);
  const weekDays = weekActivity(activeDates, today);
  const confidenceChecks = events.filter(
    (e) => e.name === "confidence_check",
  ).length;
  const confidence = computeConfidence({
    preSurvey: surveys.pre,
    postSurvey: surveys.post,
    lessonsCompleted: completed,
    confidenceChecks,
  });
  const dueFollowUp = await getDueFollowUp(user.id, today);
  const greeting = timeOfDayGreeting(new Date());

  const states = deriveLessonStates(
    lessons.map((l) => l.id),
    progress,
  );
  const continueTarget = nextLessonTarget(states);
  const continueIndex = continueTarget
    ? lessons.findIndex((l) => l.id === continueTarget)
    : -1;
  const continueLesson = continueIndex >= 0 ? lessons[continueIndex] : null;
  const continueMeta = continueLesson
    ? {
        title: continueLesson.title,
        index: continueIndex,
        estMinutes: continueLesson.estMinutes,
      }
    : null;

  return (
    <LearnHome
      firstName={first}
      greeting={greeting}
      confidence={confidence}
      deltaThisWeek={undefined}
      streak={streak.current}
      weekDays={weekDays}
      xp={xp}
      continueTarget={continueTarget}
      continueMeta={continueMeta}
      lessons={lessons}
      progress={progress}
      tree={tree}
      notified={notified}
      dueFollowUp={dueFollowUp}
    />
  );
}
