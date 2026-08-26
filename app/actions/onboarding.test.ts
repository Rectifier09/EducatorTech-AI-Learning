import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionUser = vi.fn();
const upsertProfile = vi.fn();
const logEvent = vi.fn();
const setProfileProperties = vi.fn();

vi.mock("@/lib/auth", () => ({ getSessionUser: () => getSessionUser() }));
vi.mock("@/lib/data/profile", () => ({
  upsertProfile: (id: string, patch: unknown) => upsertProfile(id, patch),
}));
vi.mock("@/lib/data/events", () => ({
  logEvent: (...args: unknown[]) => logEvent(...args),
}));
vi.mock("@/lib/analytics/mixpanel-server", () => ({
  setProfileProperties: (...args: unknown[]) => setProfileProperties(...args),
}));
vi.mock("@/lib/data/survey", () => ({
  validateSurveyInput: vi.fn(),
  insertSurvey: vi.fn(),
}));

import { completeOnboarding } from "./onboarding";

beforeEach(() => {
  vi.clearAllMocks();
  getSessionUser.mockResolvedValue({ id: "u1", email: "e", name: "n" });
});

describe("completeOnboarding", () => {
  it("tags the Mixpanel profile as organic when the user has no referrer", async () => {
    upsertProfile.mockResolvedValue({ referredBy: null });
    await completeOnboarding();
    expect(setProfileProperties).toHaveBeenCalledWith("u1", {
      acquisition_source: "organic",
    });
  });

  it("tags the Mixpanel profile as referral when the user was referred", async () => {
    upsertProfile.mockResolvedValue({ referredBy: "referrer-uuid" });
    await completeOnboarding();
    expect(setProfileProperties).toHaveBeenCalledWith("u1", {
      acquisition_source: "referral",
    });
  });
});
