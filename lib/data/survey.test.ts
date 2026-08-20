import { describe, it, expect } from "vitest";
import { validateSurveyInput } from "./survey";

describe("validateSurveyInput", () => {
  it("accepts in-range scores + a valid attitude", () => {
    expect(
      validateSurveyInput({
        phase: "pre",
        usingScore: 3,
        trustScore: 1,
        attitude: "skeptical",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects out-of-range scores", () => {
    expect(
      validateSurveyInput({ phase: "pre", usingScore: 0, trustScore: 3, attitude: "curious" }).ok,
    ).toBe(false);
    expect(
      validateSurveyInput({ phase: "pre", usingScore: 3, trustScore: 6, attitude: "curious" }).ok,
    ).toBe(false);
  });

  it("rejects an unknown attitude", () => {
    expect(
      // @ts-expect-error testing the runtime guard
      validateSurveyInput({ phase: "pre", usingScore: 3, trustScore: 3, attitude: "meh" }).ok,
    ).toBe(false);
  });
});
