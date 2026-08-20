import { describe, it, expect, vi } from "vitest";
import { makeFailoverService } from "./service";
import { AiError } from "./types";

const failing = {
  name: "gemini" as const,
  generate: vi.fn(async () => {
    throw new AiError("rate_limited");
  }),
};
const backup = {
  name: "groq" as const,
  generate: vi.fn(async () => ({ text: "from groq", provider: "groq" as const })),
};

describe("failover", () => {
  it("falls back to groq when gemini rate-limits", async () => {
    const gen = makeFailoverService(failing, backup);
    const r = await gen({ system: "s", user: "u" });
    expect(r).toMatchObject({ text: "from groq", provider: "groq" });
    expect(backup.generate).toHaveBeenCalledOnce();
  });

  it("rethrows when both providers fail", async () => {
    const backupFail = {
      name: "groq" as const,
      generate: vi.fn(async () => {
        throw new AiError("provider_error");
      }),
    };
    const gen = makeFailoverService(failing, backupFail);
    await expect(gen({ system: "s", user: "u" })).rejects.toBeInstanceOf(
      AiError,
    );
  });
});
