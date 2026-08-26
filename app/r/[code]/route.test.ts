import { describe, it, expect, vi, beforeEach } from "vitest";

const getProfileByReferralCode = vi.fn();

vi.mock("@/lib/data/profile", () => ({
  getProfileByReferralCode: (c: string) => getProfileByReferralCode(c),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /r/[code]", () => {
  it("sets the referred_by cookie and redirects to /login when the code resolves", async () => {
    getProfileByReferralCode.mockResolvedValue({ userId: "referrer-1" });
    const res = await GET(new Request("https://app.test/r/ABCD1234"), {
      params: Promise.resolve({ code: "ABCD1234" }),
    });
    expect(res.headers.get("location")).toBe("https://app.test/login");
    expect(res.cookies.get("referred_by")?.value).toBe("referrer-1");
  });

  it("redirects to /login without setting a cookie for an unknown code", async () => {
    getProfileByReferralCode.mockResolvedValue(null);
    const res = await GET(new Request("https://app.test/r/NOPE0000"), {
      params: Promise.resolve({ code: "NOPE0000" }),
    });
    expect(res.headers.get("location")).toBe("https://app.test/login");
    expect(res.cookies.get("referred_by")).toBeUndefined();
  });
});
