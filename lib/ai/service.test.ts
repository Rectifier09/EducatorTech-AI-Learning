import { describe, it, expect, vi } from "vitest";
import { makeService } from "./service";

const ok = {
  name: "gemini" as const,
  generate: vi.fn(async () => ({ text: "hi", provider: "gemini" as const })),
};
const empty = {
  name: "gemini" as const,
  generate: vi.fn(async () => ({ text: "  ", provider: "gemini" as const })),
};

describe("ai service", () => {
  it("returns the adapter's text", async () => {
    const gen = makeService(ok);
    expect((await gen({ system: "s", user: "u" })).text).toBe("hi");
  });

  it("throws AiError('empty') on blank output", async () => {
    const gen = makeService(empty);
    await expect(gen({ system: "s", user: "u" })).rejects.toMatchObject({
      code: "empty",
    });
  });
});
