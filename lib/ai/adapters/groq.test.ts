import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { groqAdapter } from "./groq";

describe("groqAdapter", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("aborts the request when the caller's signal aborts", async () => {
    const controller = new AbortController();
    let capturedSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        capturedSignal = init?.signal ?? undefined;
        return new Promise(() => {}); // never resolves — we only inspect the signal
      }),
    );

    void groqAdapter.generate({
      system: "s",
      user: "u",
      signal: controller.signal,
    });

    await Promise.resolve();

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    controller.abort();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
