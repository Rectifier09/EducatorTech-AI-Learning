import type { LeagueMember } from "@/lib/data/leaderboard";

/** Small gold marks for the top three — a quiet nod, never a scoreboard blare. */
const RANK_MARK: Record<number, string> = {
  1: "◆",
  2: "◇",
  3: "◈",
};

export function LeagueBoard({ members }: { members: LeagueMember[] }) {
  return (
    <div className="flex flex-col gap-1" role="list">
      {members.map((m) => {
        const mark = RANK_MARK[m.rank];
        return (
          <div
            key={m.userId}
            role="listitem"
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 transition ${
              m.isYou
                ? "border-[1.5px] border-brand/60 bg-brand-soft shadow-[var(--glow-gold)]"
                : "border-[1.5px] border-transparent"
            }`}
          >
            <span
              className="w-5 text-center text-[13px] font-bold text-muted"
              style={{ fontFamily: "var(--font-display)" }}
              aria-hidden="true"
            >
              {m.rank}
            </span>
            <span className="flex-1 truncate text-[14px] font-bold text-ink">
              {m.isYou ? "You" : m.name}
            </span>
            {mark && (
              <span
                className="text-[12px] text-brand-ink"
                aria-label={`Top ${m.rank} this week`}
              >
                {mark}
              </span>
            )}
            <span className="min-w-[2.5rem] text-right text-[13px] font-extrabold tabular-nums text-accent-ink">
              {m.weeklyXp}
            </span>
          </div>
        );
      })}
    </div>
  );
}
