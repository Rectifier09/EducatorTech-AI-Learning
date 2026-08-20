import { redirect } from "next/navigation";
import { getSessionUser, signOut } from "@/lib/auth";
import { getAllLessons } from "@/lib/content/loader";
import { getAllProgress } from "@/lib/data/progress";
import { PathMap } from "@/components/path/PathMap";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PathPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const first = user.name?.split(" ")[0] ?? "there";
  const lessons = getAllLessons();
  const progress = await getAllProgress(user.id);

  return (
    <main className="flex min-h-full flex-col gap-5 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Ready for today&apos;s ~4 min, {first}?
      </h1>

      {/* Stat strip — real streak/XP/confidence wired in Phase 4 */}
      <div className="flex gap-2">
        <Stat value="1🔥" label="Streak" />
        <Stat value="0" label="XP" />
        <Stat value="—" label="Confidence" />
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
