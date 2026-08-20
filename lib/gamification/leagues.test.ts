import { describe, it, expect } from "vitest";
import { weekStart, assignLeagues, rankLeague } from "./leagues";

describe("leagues", () => {
  it("weekStart returns the Monday of the week at midnight", () => {
    // 2026-08-21 is a Friday
    const ws = weekStart(new Date("2026-08-21T15:00:00"));
    expect(ws.getDay()).toBe(1); // Monday
    expect(ws.getHours()).toBe(0);
  });

  it("assignLeagues buckets deterministically by size", () => {
    const users = Array.from({ length: 25 }, (_, i) => ({
      userId: `u${String(i).padStart(2, "0")}`,
    }));
    const leagues = assignLeagues(users, 12);
    expect(leagues.map((l) => l.length)).toEqual([12, 12, 1]);
  });

  it("rankLeague sorts by weekly XP, tie-broken by who reached it first", () => {
    const ranked = rankLeague([
      { userId: "a", weeklyXp: 100, firstReachedAt: "2026-08-21T10:00:00Z" },
      { userId: "b", weeklyXp: 200, firstReachedAt: "2026-08-21T09:00:00Z" },
      { userId: "c", weeklyXp: 100, firstReachedAt: "2026-08-21T08:00:00Z" },
    ]);
    expect(ranked.map((r) => r.userId)).toEqual(["b", "c", "a"]);
    expect(ranked[0].rank).toBe(1);
  });
});
