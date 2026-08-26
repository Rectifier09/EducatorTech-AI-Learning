import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn((_t: string) => {
  void _t;
  return { select };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (t: string) => from(t) }),
}));

import { getProfileByReferralCode } from "./profile";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfileByReferralCode", () => {
  it("looks up the code via the admin client (bypassing RLS) and returns only the owner's userId", async () => {
    maybeSingle.mockResolvedValue({ data: { user_id: "referrer-1" }, error: null });
    const p = await getProfileByReferralCode("ABCD1234");
    expect(p).toEqual({ userId: "referrer-1" });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("user_id");
    expect(eq).toHaveBeenCalledWith("referral_code", "ABCD1234");
  });

  it("returns null when no profile has that code", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const p = await getProfileByReferralCode("NOPE0000");
    expect(p).toBeNull();
  });

  it("returns null and does not throw when the query errors", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "db down" } });
    const p = await getProfileByReferralCode("ABCD1234");
    expect(p).toBeNull();
  });
});
