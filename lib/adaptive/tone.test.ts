import { describe, it, expect } from "vitest";
import { tonePrefs } from "./tone";

describe("tonePrefs", () => {
  it("goes gentle + hides go-deeper for skeptical/cautious", () => {
    for (const a of ["skeptical", "cautious"] as const) {
      expect(tonePrefs(a)).toEqual({ pace: "gentle", showGoDeeper: false });
    }
  });

  it("shows go-deeper for excited/curious", () => {
    for (const a of ["excited", "curious"] as const) {
      expect(tonePrefs(a).showGoDeeper).toBe(true);
    }
  });
});
