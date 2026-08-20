import { describe, it, expect } from "vitest";
import { confidenceDelta } from "./delta";

describe("confidenceDelta", () => {
  it("computes score deltas and an upward attitude shift", () => {
    expect(
      confidenceDelta(
        { usingScore: 2, trustScore: 1, attitude: "skeptical" },
        { usingScore: 4, trustScore: 3, attitude: "curious" },
      ),
    ).toEqual({ usingDelta: 2, trustDelta: 2, attitudeShift: "up" });
  });

  it("reports 'same' when attitude is unchanged", () => {
    expect(
      confidenceDelta(
        { usingScore: 3, trustScore: 3, attitude: "curious" },
        { usingScore: 3, trustScore: 4, attitude: "curious" },
      ).attitudeShift,
    ).toBe("same");
  });
});
