import { describe, it, expect } from "vitest";
import { ONBOARDING_STEPS, nextStep, prevStep } from "./steps";

describe("onboarding steps", () => {
  it("orders steps welcome→role→subject→grade→survey→trust→taste", () => {
    expect(ONBOARDING_STEPS).toEqual([
      "welcome",
      "role",
      "subject",
      "grade",
      "survey",
      "trust",
      "taste",
    ]);
  });

  it("advances and rewinds correctly and terminates at the ends", () => {
    expect(nextStep("welcome")).toBe("role");
    expect(nextStep("taste")).toBeNull();
    expect(prevStep("welcome")).toBeNull();
    expect(prevStep("survey")).toBe("grade");
  });
});
