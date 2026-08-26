import { describe, it, expect } from "vitest";
import { rowToProfile, profileToRow, isOnboardingComplete } from "./mappers";

describe("profile mappers", () => {
  it("maps a db row (snake_case) to a Profile (camelCase)", () => {
    const p = rowToProfile({
      user_id: "u1",
      role: "School teacher",
      subject: "Science",
      grade_band: "Middle",
      confidence_using: 2,
      confidence_trust: 3,
      attitude: "skeptical",
      reminder_time: null,
      onboarded_at: "2026-08-20T00:00:00Z",
      referral_code: "ABCD1234",
      referred_by: "referrer-1",
    });
    expect(p).toMatchObject({
      userId: "u1",
      subject: "Science",
      gradeBand: "Middle",
      confidenceUsing: 2,
      attitude: "skeptical",
      onboardedAt: "2026-08-20T00:00:00Z",
      referralCode: "ABCD1234",
      referredBy: "referrer-1",
    });
  });

  it("defaults referralCode/referredBy to null when the row omits them", () => {
    const p = rowToProfile({
      user_id: "u1",
      role: null,
      subject: null,
      grade_band: null,
      confidence_using: null,
      confidence_trust: null,
      attitude: null,
      reminder_time: null,
      onboarded_at: null,
    });
    expect(p.referralCode).toBeNull();
    expect(p.referredBy).toBeNull();
  });

  it("maps a partial Profile patch back to a snake_case row, dropping undefined", () => {
    const row = profileToRow({ gradeBand: "Senior", attitude: "curious" });
    expect(row).toEqual({ grade_band: "Senior", attitude: "curious" });
  });

  it("maps referralCode/referredBy patches to their snake_case columns", () => {
    const row = profileToRow({ referralCode: "ABCD1234", referredBy: "referrer-1" });
    expect(row).toEqual({ referral_code: "ABCD1234", referred_by: "referrer-1" });
  });

  it("treats onboarding incomplete until all core fields + onboardedAt are set", () => {
    expect(isOnboardingComplete(null)).toBe(false);
    expect(
      isOnboardingComplete({
        userId: "u",
        role: "t",
        subject: "s",
        gradeBand: "g",
        confidenceUsing: 1,
        confidenceTrust: 1,
        attitude: "curious",
        reminderTime: null,
        onboardedAt: null,
        alias: null,
        displayName: null,
        referralCode: null,
        referredBy: null,
      }),
    ).toBe(false);
    expect(
      isOnboardingComplete({
        userId: "u",
        role: "t",
        subject: "s",
        gradeBand: "g",
        confidenceUsing: 1,
        confidenceTrust: 1,
        attitude: "curious",
        reminderTime: null,
        onboardedAt: "2026-08-20T00:00:00Z",
        alias: null,
        displayName: null,
        referralCode: null,
        referredBy: null,
      }),
    ).toBe(true);
  });
});
