import { describe, it, expect, vi, beforeEach } from "vitest";

const generate = vi.fn();
const logEvent = vi.fn();
const checkRateLimit = vi.fn();
const getSessionUser = vi.fn();
const getProfile = vi.fn();

vi.mock("@/lib/auth", () => ({ getSessionUser: () => getSessionUser() }));
vi.mock("@/lib/data/profile", () => ({ getProfile: () => getProfile() }));
vi.mock("./rateLimit", () => ({
  checkRateLimit: () => checkRateLimit(),
  DAILY_LIMIT: 30,
}));
vi.mock("./service", () => ({ generate: (i: unknown) => generate(i) }));
vi.mock("@/lib/data/events", () => ({
  logEvent: (n: string, p: unknown) => logEvent(n, p),
}));

import { handleGenerate } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
  getSessionUser.mockResolvedValue({ id: "u1", email: "e", name: "n" });
  getProfile.mockResolvedValue({
    role: "teacher",
    subject: "Science",
    gradeBand: "Middle",
  });
});

describe("handleGenerate", () => {
  it("blocks when rate-limited, without generating", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 });
    const r = await handleGenerate({
      userText: "Make a worksheet",
      mode: "playground",
    });
    expect(r).toMatchObject({ code: "rate_limited" });
    expect(generate).not.toHaveBeenCalled();
  });

  it("redirects off-topic (empty) without generating", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    const r = await handleGenerate({ userText: "", mode: "playground" });
    expect("text" in r).toBe(true);
    expect(generate).not.toHaveBeenCalled();
  });

  it("happy path returns text and logs ai_generate once", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Here is a worksheet", provider: "gemini" });
    const r = await handleGenerate({
      userText: "Make a worksheet",
      mode: "playground",
    });
    expect(r).toMatchObject({ text: "Here is a worksheet" });
    expect(logEvent).toHaveBeenCalledTimes(1);
    expect(logEvent).toHaveBeenCalledWith("ai_generate", expect.any(Object));
  });

  it("passes the caller's abort signal through to generate()", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Here is a worksheet", provider: "gemini" });
    const controller = new AbortController();
    await handleGenerate({
      userText: "Make a worksheet",
      mode: "playground",
      signal: controller.signal,
    });
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("requests structured JSON and returns templateType/structured on success", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({
      text: '{"title":"Quiz","questions":[{"number":1,"prompt":"1+1?","answer":"2"}]}',
      provider: "gemini",
    });
    const r = await handleGenerate({
      userText: "Make a quiz",
      mode: "playground",
      artifactType: "Quiz",
    });
    expect(r).toMatchObject({
      templateType: "questionSet",
      structured: { title: "Quiz" },
    });
    // the system prompt handed to generate() must carry the JSON instruction
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ system: expect.stringMatching(/JSON/) }),
    );
  });

  it("falls back to plain text when the model ignores the JSON instruction", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Sure, here's a quiz idea...", provider: "gemini" });
    const r = await handleGenerate({
      userText: "Make a quiz",
      mode: "playground",
      artifactType: "Quiz",
    });
    expect(r).toMatchObject({ text: "Sure, here's a quiz idea..." });
    expect((r as { templateType?: unknown }).templateType).toBeUndefined();
  });

  it("skips JSON-mode entirely when artifactType has no archetype", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Here's an activity idea", provider: "gemini" });
    const r = await handleGenerate({
      userText: "Give me an idea",
      mode: "playground",
      artifactType: "Activity idea",
    });
    expect(r).toMatchObject({ text: "Here's an activity idea" });
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ system: expect.not.stringMatching(/JSON/) }),
    );
  });
});
