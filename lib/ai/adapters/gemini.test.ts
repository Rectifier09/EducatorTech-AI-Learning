import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geminiAdapter } from "./gemini";

describe("geminiAdapter", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
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

    void geminiAdapter.generate({
      system: "s",
      user: "u",
      signal: controller.signal,
    });

    // Let the fetch call happen before we abort.
    await Promise.resolve();

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    controller.abort();
    expect(capturedSignal?.aborted).toBe(true);
  });
});
