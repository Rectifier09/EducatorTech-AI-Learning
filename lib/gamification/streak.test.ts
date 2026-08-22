import { describe, it, expect } from "vitest";
import { computeStreak, weekActivity } from "./streak";

describe("computeStreak", () => {
  it("counts consecutive active days", () => {
    expect(
      computeStreak(["2026-08-18", "2026-08-19", "2026-08-20"], "2026-08-20")
        .current,
    ).toBe(3);
  });

  it("bridges a single missed day with a freeze", () => {
    const r = computeStreak(["2026-08-17", "2026-08-19"], "2026-08-19");
    expect(r.current).toBe(2);
    expect(r.freezeUsed).toBe(true);
  });

  it("resets after two consecutive missed days", () => {
    expect(
      computeStreak(["2026-08-15", "2026-08-20"], "2026-08-20").current,
    ).toBe(1);
  });

  it("is 0 when today has no activity and no bridge", () => {
    expect(computeStreak(["2026-08-15"], "2026-08-20").current).toBe(0);
  });
});

describe("weekActivity", () => {
  it("returns the trailing 7 days ending today, oldest → newest", () => {
    const w = weekActivity([], "2026-08-20");
    expect(w).toHaveLength(7);
    expect(w.map((d) => d.date)).toEqual([
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
    ]);
  });

  it("marks today, and only active dates within the window", () => {
    const w = weekActivity(
      ["2026-08-18", "2026-08-20", "2026-07-01"], // 07-01 is outside the window
      "2026-08-20",
    );
    expect(w.filter((d) => d.active).map((d) => d.date)).toEqual([
      "2026-08-18",
      "2026-08-20",
    ]);
    const today = w[w.length - 1];
    expect(today.date).toBe("2026-08-20");
    expect(today.isToday).toBe(true);
    expect(w.filter((d) => d.isToday)).toHaveLength(1);
  });

  it("labels each dot with its UTC weekday initial", () => {
    const w = weekActivity([], "2026-08-20");
    expect(w.map((d) => d.label)).toEqual(["F", "S", "S", "M", "T", "W", "T"]);
  });

  it("honours a custom window length", () => {
    expect(weekActivity([], "2026-08-20", 3).map((d) => d.date)).toEqual([
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
    ]);
  });
});
