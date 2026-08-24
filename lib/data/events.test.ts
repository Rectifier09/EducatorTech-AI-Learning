import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: () => ({
      insert: async () => {
        throw new Error("db down");
      },
    }),
  }),
}));
vi.mock("@/lib/auth", () => ({
  getSessionUser: async () => ({ id: "u1", email: "e", name: "n" }),
}));
const trackServer = vi.fn(async () => {});
vi.mock("@/lib/analytics/mixpanel-server", () => ({ trackServer }));

import { logEvent } from "./events";

describe("logEvent", () => {
  beforeEach(() => trackServer.mockClear());

  it("never throws even if the insert fails", async () => {
    await expect(
      logEvent("lesson_started", { lessonId: "l1" }),
    ).resolves.toBeUndefined();
  });

  it("mirrors the event to Mixpanel with the session user's id", async () => {
    await logEvent("lesson_started", { lessonId: "l1" });
    expect(trackServer).toHaveBeenCalledWith("lesson_started", "u1", {
      lessonId: "l1",
    });
  });
});
