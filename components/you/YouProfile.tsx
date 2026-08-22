import { ConfidenceGauge } from "@/components/gamification/ConfidenceGauge";
import { LeagueBoard } from "@/components/gamification/LeagueBoard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { LeagueMember } from "@/lib/data/leaderboard";
import type { Badge } from "@/lib/gamification/badges";

interface YouProfileProps {
  firstName: string;
  confidence: number;
  xp: number;
  streak: number;
  badges: Badge[];
  league: LeagueMember[];
  daysLeft: number;
  setAlias: (formData: FormData) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * The You tab: a members'-profile treatment of the existing gamification
 * data — the same signature gauge, now anchoring your identity rather than
 * the front door, plus XP/streak, badges, and the weekly league. No data or
 * action changes; this composes loaders/actions the caller already ran.
 */
export function YouProfile({
  firstName,
  confidence,
  xp,
  streak,
  badges,
  league,
  daysLeft,
  setAlias,
  signOut,
}: YouProfileProps) {
  return (
    <main className="flex min-h-full flex-col gap-8 px-6 pb-10 pt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[0.95rem] font-semibold text-muted">
          {firstName}&apos;s standing
        </p>
        <ConfidenceGauge value={confidence} />
      </div>

      <div className="flex gap-3">
        <StatTile value={xp} label="XP earned" />
        <StatTile value={streak} label="Day streak" ember />
      </div>

      {badges.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel>Badges</SectionLabel>
          <div className="flex flex-wrap gap-4">
            {badges.map((b) => (
              <Medallion key={b.id} badge={b} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <SectionLabel>This week&apos;s league</SectionLabel>
          <p className="text-[13px] text-muted">
            Resets in {daysLeft} day{daysLeft === 1 ? "" : "s"} · ranked on
            effort, not scores.
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-surface shadow-[var(--elev-1)] p-2">
          <LeagueBoard members={league} />
        </div>
      </section>

      <form action={setAlias} className="flex gap-2">
        <input
          name="alias"
          maxLength={20}
          placeholder="Display name (optional)"
          className="flex-1 rounded-xl border-[1.5px] border-line-2 bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        <Button variant="ghost" type="submit">
          Save
        </Button>
      </form>

      <form action={signOut} className="mt-auto pt-2">
        <Button variant="ghost" type="submit" className="w-full">
          Sign out
        </Button>
      </form>
    </main>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2
      className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-muted"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </h2>
  );
}

function StatTile({
  value,
  label,
  ember,
}: {
  value: number;
  label: string;
  ember?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-line bg-surface shadow-[var(--elev-1)] flex flex-1 flex-col items-center gap-1 p-4">
      <span
        className="flex items-center gap-1.5 font-semibold tabular-nums leading-none text-[1.9rem]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {ember && (
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full bg-brand shadow-[var(--glow-gold)]"
          />
        )}
        {value}
      </span>
      <span className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </span>
    </div>
  );
}

function Medallion({ badge }: { badge: Badge }) {
  return (
    <div className="flex w-[4.5rem] flex-col items-center gap-1.5 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-brand/50 bg-gradient-to-b from-surface-2 to-surface text-[1.35rem] shadow-[var(--glow-gold)]"
        aria-hidden="true"
      >
        {badge.emoji}
      </div>
      <span className="text-[0.68rem] font-bold leading-tight text-muted">
        {badge.label}
      </span>
    </div>
  );
}
