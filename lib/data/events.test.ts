import { describe, it, expect, vi } from "vitest";

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

import { logEvent } from "./events";

describe("logEvent", () => {
  it("never throws even if the insert fails", async () => {
    await expect(
      logEvent("lesson_started", { lessonId: "l1" }),
    ).resolves.toBeUndefined();
  });
});
