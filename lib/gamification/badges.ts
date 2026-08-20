import type { LessonProgress } from "@/lib/data/types";

export interface Badge {
  id: string;
  label: string;
  emoji: string;
}

export interface BadgeContext {
  progress: Record<string, Pick<LessonProgress, "status">>;
  events: { name: string }[];
  streakCurrent: number;
}

function done(
  progress: BadgeContext["progress"],
  lessonId: string,
): boolean {
  return progress[lessonId]?.status === "completed";
}

export function earnedBadges(ctx: BadgeContext): Badge[] {
  const out: Badge[] = [];
  const completed = Object.values(ctx.progress).filter(
    (p) => p.status === "completed",
  ).length;
  const hasArtifact = ctx.events.some((e) => e.name === "artifact_saved");

  if (hasArtifact || done(ctx.progress, "l4"))
    out.push({ id: "first-draft", label: "First Draft", emoji: "🏅" });
  if (done(ctx.progress, "l5"))
    out.push({ id: "editor", label: "Editor", emoji: "✏️" });
  if (done(ctx.progress, "l6"))
    out.push({ id: "sceptic", label: "Sceptic", emoji: "🧭" });
  if (completed >= 7)
    out.push({ id: "foundations", label: "Foundations", emoji: "🎓" });
  if (ctx.streakCurrent >= 3)
    out.push({ id: "streak-3", label: "3-day streak", emoji: "🔥" });
  if (ctx.streakCurrent >= 7)
    out.push({ id: "streak-7", label: "7-day streak", emoji: "🔥" });

  return out;
}
