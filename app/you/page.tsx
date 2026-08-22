import { redirect } from "next/navigation";
import { getSessionUser, signOut } from "@/lib/auth";
import { getAllProgress } from "@/lib/data/progress";
import { getUserEvents } from "@/lib/data/events";
import { getSurveys } from "@/lib/data/survey";
import { computeXp } from "@/lib/gamification/xp";
import {
  computeStreak,
  activeDatesFromEvents,
} from "@/lib/gamification/streak";
import { computeConfidence } from "@/lib/gamification/confidence";
import { earnedBadges } from "@/lib/gamification/badges";
import { getMyLeague } from "@/lib/data/leaderboard";
import { weekStart } from "@/lib/gamification/leagues";
import { setAlias } from "@/app/actions/leaderboard";
import { YouProfile } from "@/components/you/YouProfile";

export const dynamic = "force-dynamic";

// Full profile host for the You tab: your identity — the signature gauge,
// XP/streak, badges, and the weekly league — composed from the same
// loaders the old /path and /leaderboard pages used. Sign-out (formerly on
// the /path footer) lives here for good, alongside the alias form.
export default async function YouPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const progress = await getAllProgress(user.id);
  const events = await getUserEvents(user.id);
  const surveys = await getSurveys(user.id);

  const completed = Object.values(progress).filter(
    (p) => p.status === "completed",
  ).length;
  const xp = computeXp(events);
  const today = new Date().toISOString().slice(0, 10);
  const streak = computeStreak(activeDatesFromEvents(events), today);
  const confidenceChecks = events.filter(
    (e) => e.name === "confidence_check",
  ).length;
  const confidence = computeConfidence({
    preSurvey: surveys.pre,
    postSurvey: surveys.post,
    lessonsCompleted: completed,
    confidenceChecks,
  });
  const badges = earnedBadges({
    progress,
    events,
    streakCurrent: streak.current,
  });

  const members = await getMyLeague(user.id);
  const ws = weekStart(new Date());
  const nextReset = new Date(ws);
  nextReset.setDate(ws.getDate() + 7);
  const daysLeft = Math.max(
    0,
    Math.ceil((nextReset.getTime() - Date.now()) / 86_400_000),
  );

  const first = user.name?.split(" ")[0] ?? "there";

  return (
    <YouProfile
      firstName={first}
      confidence={confidence}
      streak={streak.current}
      xp={xp}
      badges={badges}
      league={members}
      daysLeft={daysLeft}
      setAlias={setAlias}
      signOut={signOut}
    />
  );
}
