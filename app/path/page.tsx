import { redirect } from "next/navigation";
import { getSessionUser, signOut } from "@/lib/auth";
import { getAllLessons } from "@/lib/content/loader";
import { getAllProgress } from "@/lib/data/progress";
import { getProfile } from "@/lib/data/profile";
import { PathMap } from "@/components/path/PathMap";
import { Button } from "@/components/ui/Button";

// Light interim values from existing data. Phase 4 formalizes the full
// mechanics (forgiving streak, effort XP, the animated Confidence Meter).
const XP_PER_LESSON = 50;

export const dynamic = "force-dynamic";

export default async function PathPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const first = user.name?.split(" ")[0] ?? "there";
  const lessons = getAllLessons();
  const progress = await getAllProgress(user.id);
  const profile = await getProfile(user.id);

  const completed = Object.values(progress).filter(
    (p) => p.status === "completed",
  ).length;
  const xp = completed * XP_PER_LESSON;
  const confidence =
    profile?.confidenceUsing != null && profile?.confidenceTrust != null
      ? Math.round(
          (((profile.confidenceUsing + profile.confidenceTrust) / 2) / 5) * 100,
        )
      : null;

  return (
    <main className="flex min-h-full flex-col gap-5 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Ready for today&apos;s ~4 min, {first}?
      </h1>

      {/* Interim values from real data; Phase 4 adds the full gamification. */}
      <div className="flex gap-2">
        <Stat value={completed > 0 ? "1🔥" : "0"} label="Streak" />
        <Stat value={String(xp)} label="XP" />
        <Stat value={confidence != null ? `${confidence}%` : "—"} label="Confidence" />
      </div>

      <PathMap lessons={lessons} progress={progress} />

      <form action={signOut} className="mt-auto pt-4">
        <Button variant="ghost" type="submit">
          Sign out
        </Button>
      </form>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-xl border border-line bg-surface p-2 text-center">
      <div className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}
