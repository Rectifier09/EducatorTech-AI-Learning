import { describe, it, expect, vi, afterEach } from "vitest";
import { trackServer } from "./mixpanel-server";

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

afterEach(() => {
  process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = ORIGINAL_TOKEN;
  vi.restoreAllMocks();
});

describe("trackServer", () => {
  it("no-ops without a project token", async () => {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    const fetchSpy = vi.spyOn(global, "fetch");
    await trackServer("lesson_started", "u1", { lessonId: "l1" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the event to Mixpanel's track API when configured", async () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "test-token";
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("1"));

    await trackServer("lesson_started", "u1", { lessonId: "l1" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.mixpanel.com/track");
    const body = JSON.parse(init!.body as string);
    expect(body[0]).toMatchObject({
      event: "lesson_started",
      properties: {
        lessonId: "l1",
        token: "test-token",
        distinct_id: "u1",
      },
    });
  });

  it("never throws even if the network call fails", async () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "test-token";
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));

    await expect(trackServer("lesson_started", "u1")).resolves.toBeUndefined();
  });
});
