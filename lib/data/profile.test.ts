import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn((_t: string) => {
  void _t;
  return { select };
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ from: (t: string) => from(t) }),
}));

import { getProfileByReferralCode } from "./profile";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfileByReferralCode", () => {
  it("returns the matching profile", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        user_id: "referrer-1",
        role: null,
        subject: null,
        grade_band: null,
        confidence_using: null,
        confidence_trust: null,
        attitude: null,
        reminder_time: null,
        onboarded_at: null,
        referral_code: "ABCD1234",
      },
    });
    const p = await getProfileByReferralCode("ABCD1234");
    expect(p?.userId).toBe("referrer-1");
    expect(from).toHaveBeenCalledWith("profiles");
    expect(eq).toHaveBeenCalledWith("referral_code", "ABCD1234");
  });

  it("returns null when no profile has that code", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const p = await getProfileByReferralCode("NOPE0000");
    expect(p).toBeNull();
  });
});
