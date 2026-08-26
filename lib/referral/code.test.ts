import { describe, it, expect } from "vitest";
import { generateReferralCode } from "./code";

describe("generateReferralCode", () => {
  it("returns an 8-character code using only unambiguous uppercase letters and digits", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });

  it("is not the same on every call", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
