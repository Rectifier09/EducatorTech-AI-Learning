import { describe, it, expect } from "vitest";
import { nextCollapsed } from "./collapse";

describe("nextCollapsed", () => {
  it("collapses once past the enter threshold", () => {
    expect(nextCollapsed(80, false)).toBe(true);
  });
  it("stays expanded below the enter threshold", () => {
    expect(nextCollapsed(50, false)).toBe(false);
  });
  it("stays collapsed in the hysteresis band", () => {
    expect(nextCollapsed(50, true)).toBe(true);
  });
  it("expands again only below the exit threshold", () => {
    expect(nextCollapsed(20, true)).toBe(false);
  });
  it("respects custom thresholds", () => {
    expect(nextCollapsed(120, false, { enter: 100, exit: 40 })).toBe(true);
  });
});
