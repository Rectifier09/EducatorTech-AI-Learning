import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, signOut } from "@/lib/auth";
import { getAllLessons } from "@/lib/content/loader";
import { getAllProgress } from "@/lib/data/progress";
import { getUserEvents } from "@/lib/data/events";
import { getSurveys } from "@/lib/data/survey";
import { computeXp } from "@/lib/gamification/xp";
import { computeStreak, activeDatesFromEvents } from "@/lib/gamification/streak";
import { computeConfidence } from "@/lib/gamification/confidence";
import { earnedBadges } from "@/lib/gamification/badges";
import { getDueFollowUp } from "@/lib/data/commitments";
import { PathMap } from "@/components/path/PathMap";
import { ClassFollowUp } from "@/components/followup/ClassFollowUp";
import { ConfidenceMeter } from "@/components/gamification/ConfidenceMeter";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PathPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const first = user.name?.split(" ")[0] ?? "there";
  const lessons = getAllLessons();
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
  const dueFollowUp = await getDueFollowUp(user.id, today);

  return (
    <main className="flex min-h-full flex-col gap-5 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Ready for today&apos;s ~4 min, {first}?
      </h1>

      <div className="flex gap-2">
        <Stat value={`${streak.current}🔥`} label="Streak" />
        <Stat value={String(xp)} label="XP" />
      </div>

      <div className="rounded-xl border border-line bg-surface p-3">
        <ConfidenceMeter value={confidence} />
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[13px] font-bold"
            >
              {b.emoji} {b.label}
            </span>
          ))}
        </div>
      )}

      {dueFollowUp && <ClassFollowUp id={dueFollowUp.id} />}

      <PathMap lessons={lessons} progress={progress} />

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <div className="flex gap-2">
          <Link href="/explore" className="flex-1">
            <Button variant="ghost" className="w-full">
              Explore
            </Button>
          </Link>
          <Link href="/leaderboard" className="flex-1">
            <Button variant="ghost" className="w-full">
              Leaderboard
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/playground" className="flex-1">
            <Button variant="ghost" className="w-full">
              Playground
            </Button>
          </Link>
          <Link href="/toolkit" className="flex-1">
            <Button variant="ghost" className="w-full">
              My Toolkit
            </Button>
          </Link>
        </div>
        <form action={signOut}>
          <Button variant="ghost" type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface p-2 text-center">
      <div
        className="font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
