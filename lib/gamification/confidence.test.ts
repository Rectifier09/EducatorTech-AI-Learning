import { describe, it, expect } from "vitest";
import { computeConfidence } from "./confidence";

describe("computeConfidence", () => {
  it("seeds from the pre-survey average (2/5 -> 40)", () => {
    expect(
      computeConfidence({ preSurvey: { usingScore: 2, trustScore: 2 } }),
    ).toBe(40);
  });

  it("grows with activity but never exceeds 100", () => {
    const v = computeConfidence({
      preSurvey: { usingScore: 2, trustScore: 2 },
      lessonsCompleted: 7,
      confidenceChecks: 7,
    });
    expect(v).toBeGreaterThan(40);
    expect(v).toBeLessThanOrEqual(100);
  });

  it("re-anchors to the post-survey once it exists (honest, not inflated)", () => {
    expect(
      computeConfidence({
        preSurvey: { usingScore: 1, trustScore: 1 },
        lessonsCompleted: 7,
        confidenceChecks: 7,
        postSurvey: { usingScore: 4, trustScore: 4 },
      }),
    ).toBe(80);
  });

  it("defaults to a low baseline with no pre-survey", () => {
    expect(computeConfidence({ preSurvey: null })).toBe(20);
  });
});
