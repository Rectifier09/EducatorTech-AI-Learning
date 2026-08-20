import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getMyLeague } from "@/lib/data/leaderboard";
import { weekStart } from "@/lib/gamification/leagues";
import { LeagueBoard } from "@/components/gamification/LeagueBoard";
import { setAlias } from "@/app/actions/leaderboard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const members = await getMyLeague(user.id);

  const ws = weekStart(new Date());
  const nextReset = new Date(ws);
  nextReset.setDate(ws.getDate() + 7);
  const daysLeft = Math.max(
    0,
    Math.ceil((nextReset.getTime() - Date.now()) / 86_400_000),
  );

  return (
    <main className="flex min-h-full flex-col gap-4 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        This week&apos;s league
      </h1>
      <p className="-mt-2 text-sm text-muted">
        Resets in {daysLeft} day{daysLeft === 1 ? "" : "s"} · ranked on effort,
        not scores.
      </p>

      <LeagueBoard members={members} />

      <p className="rounded-xl border border-success bg-success-soft p-3 text-[13px] font-bold text-success-ink">
        Every lesson counts — you&apos;re moving. Keep it up. 🌱
      </p>

      <form action={setAlias} className="flex gap-2">
        <input
          name="alias"
          maxLength={20}
          placeholder="Display name (optional)"
          className="flex-1 rounded-xl border-[1.5px] border-line-2 bg-surface px-3 py-2 text-[14px]"
        />
        <Button variant="ghost" type="submit">
          Save
        </Button>
      </form>

      <Link href="/path" className="mt-auto pt-2">
        <Button variant="ghost">Back to path</Button>
      </Link>
    </main>
  );
}
