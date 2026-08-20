import type { LeagueMember } from "@/lib/data/leaderboard";

export function LeagueBoard({ members }: { members: LeagueMember[] }) {
  return (
    <div className="flex flex-col gap-1">
      {members.map((m) => (
        <div
          key={m.userId}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
            m.isYou ? "bg-brand-soft" : ""
          }`}
        >
          <span
            className="w-5 text-center font-semibold text-muted"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {m.rank}
          </span>
          <span className="flex-1 text-[14px] font-bold">
            {m.isYou ? "You" : m.name}
            {m.rank <= 3 && <span className="ml-1.5 text-[11px]">🏅</span>}
          </span>
          <span className="text-[13px] font-extrabold tabular-nums text-accent-ink">
            {m.weeklyXp}
          </span>
        </div>
      ))}
    </div>
  );
}
