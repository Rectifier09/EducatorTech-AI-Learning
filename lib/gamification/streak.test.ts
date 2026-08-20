import { describe, it, expect } from "vitest";
import { computeStreak } from "./streak";

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
