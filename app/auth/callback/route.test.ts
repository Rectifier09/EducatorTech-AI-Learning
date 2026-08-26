import { describe, it, expect, vi, beforeEach } from "vitest";

const exchangeCodeForSession = vi.fn();
const get = vi.fn();
const del = vi.fn();
const getProfile = vi.fn();
const upsertProfile = vi.fn();
const logEvent = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    auth: { exchangeCodeForSession: (c: string) => exchangeCodeForSession(c) },
  }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get, delete: del }),
}));
vi.mock("@/lib/data/profile", () => ({
  getProfile: (id: string) => getProfile(id),
  upsertProfile: (id: string, patch: unknown) => upsertProfile(id, patch),
}));
vi.mock("@/lib/data/events", () => ({
  logEvent: (n: string, p?: unknown) => logEvent(n, p),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockResolvedValue({
    data: { user: { id: "new-user" } },
    error: null,
  });
  get.mockReturnValue(undefined);
  getProfile.mockResolvedValue(null);
});

describe("auth callback", () => {
  it("redirects to next on successful auth with no referral cookie pending", async () => {
    const res = await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(res.headers.get("location")).toBe("https://app.test/");
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("attributes the referral for a genuinely new user with a pending cookie", async () => {
    get.mockReturnValue({ value: "referrer-1" });
    await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(upsertProfile).toHaveBeenCalledWith("new-user", { referredBy: "referrer-1" });
    expect(logEvent).toHaveBeenCalledWith("referral_signup", { referredBy: "referrer-1" });
    expect(del).toHaveBeenCalledWith("referred_by");
  });

  it("does not attribute referral for a user who already has a profile", async () => {
    get.mockReturnValue({ value: "referrer-1" });
    getProfile.mockResolvedValue({ userId: "new-user" });
    await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("guards against a self-referral", async () => {
    get.mockReturnValue({ value: "new-user" });
    await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=auth when the code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {},
      error: { message: "bad code" },
    });
    const res = await GET(new Request("https://app.test/auth/callback?code=bad"));
    expect(res.headers.get("location")).toBe("https://app.test/login?error=auth");
    expect(upsertProfile).not.toHaveBeenCalled();
  });
});
