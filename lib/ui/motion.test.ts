import { describe, it, expect } from "vitest";
import { easeOutCubic, countUpValue } from "./motion";

describe("easeOutCubic", () => {
  it("is 0 at 0 and 1 at 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
  it("is ahead of linear at the midpoint", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("countUpValue", () => {
  it("returns from at progress 0 and to at progress 1", () => {
    expect(countUpValue(41, 62, 0)).toBe(41);
    expect(countUpValue(41, 62, 1)).toBe(62);
  });
  it("clamps progress outside 0..1", () => {
    expect(countUpValue(0, 100, -1)).toBe(0);
    expect(countUpValue(0, 100, 2)).toBe(100);
  });
  it("counts downward too", () => {
    expect(countUpValue(100, 0, 0)).toBe(100);
    expect(countUpValue(100, 0, 1)).toBe(0);
  });
});
