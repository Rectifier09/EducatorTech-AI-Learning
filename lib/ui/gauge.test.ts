import { describe, it, expect } from "vitest";
import { clampScore, gaugeDash } from "./gauge";

describe("clampScore", () => {
  it("clamps below 0 and above 100 and rounds", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(61.6)).toBe(62);
  });
});

describe("gaugeDash", () => {
  it("returns zero filled length at 0", () => {
    expect(gaugeDash(0).valueLen).toBe(0);
  });
  it("returns the full sweep at 100", () => {
    expect(gaugeDash(100).valueLen).toBe(75);
  });
  it("returns 46.5 at 62 with the default 75 sweep", () => {
    expect(gaugeDash(62).valueLen).toBe(46.5);
  });
  it("formats the dasharrays against pathLength 100", () => {
    const d = gaugeDash(62);
    expect(d.track).toBe("75 100");
    expect(d.value).toBe("46.5 100");
  });
  it("respects a custom sweep", () => {
    expect(gaugeDash(50, 60).valueLen).toBe(30);
  });
});
