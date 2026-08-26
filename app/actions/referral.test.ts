import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionUser = vi.fn();
const getProfile = vi.fn();
const upsertProfile = vi.fn();
const generateReferralCode = vi.fn();
const logEvent = vi.fn();

vi.mock("@/lib/auth", () => ({ getSessionUser: () => getSessionUser() }));
vi.mock("@/lib/data/profile", () => ({
  getProfile: (id: string) => getProfile(id),
  upsertProfile: (id: string, patch: unknown) => upsertProfile(id, patch),
}));
vi.mock("@/lib/referral/code", () => ({
  generateReferralCode: () => generateReferralCode(),
}));
vi.mock("@/lib/data/events", () => ({
  logEvent: (...args: unknown[]) => logEvent(...args),
}));

import { getOrCreateReferralCode, logReferralShare } from "./referral";

beforeEach(() => {
  vi.clearAllMocks();
  getSessionUser.mockResolvedValue({ id: "u1", email: "e", name: "n" });
});

describe("getOrCreateReferralCode", () => {
  it("returns the existing code without generating a new one", async () => {
    getProfile.mockResolvedValue({ referralCode: "EXIST123" });
    const code = await getOrCreateReferralCode();
    expect(code).toBe("EXIST123");
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("generates and persists a new code when none exists", async () => {
    getProfile.mockResolvedValue(null);
    generateReferralCode.mockReturnValue("NEWCODE1");
    upsertProfile.mockResolvedValue({ referralCode: "NEWCODE1" });
    const code = await getOrCreateReferralCode();
    expect(code).toBe("NEWCODE1");
    expect(upsertProfile).toHaveBeenCalledWith("u1", { referralCode: "NEWCODE1" });
  });

  it("retries once on a unique-constraint collision", async () => {
    getProfile.mockResolvedValue(null);
    generateReferralCode
      .mockReturnValueOnce("COLLIDE1")
      .mockReturnValueOnce("UNIQUE01");
    upsertProfile
      .mockRejectedValueOnce(new Error("duplicate key"))
      .mockResolvedValueOnce({ referralCode: "UNIQUE01" });
    const code = await getOrCreateReferralCode();
    expect(code).toBe("UNIQUE01");
    expect(upsertProfile).toHaveBeenCalledTimes(2);
  });
});

describe("logReferralShare", () => {
  it("logs a referral_link_shared event", async () => {
    await logReferralShare();
    expect(logEvent).toHaveBeenCalledWith("referral_link_shared");
  });
});
