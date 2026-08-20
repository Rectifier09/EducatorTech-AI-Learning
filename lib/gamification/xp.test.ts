import { describe, it, expect } from "vitest";
import { computeXp, weeklyXp } from "./xp";
import type { AppEvent } from "@/lib/data/types";

const ev = (name: string, createdAt: string): AppEvent => ({
  userId: "u",
  name,
  props: {},
  createdAt,
});

describe("xp", () => {
  it("sums XP per event rule, ignoring unknown events", () => {
    const events = [
      ev("lesson_completed", "2026-08-21T10:00:00Z"),
      ev("artifact_saved", "2026-08-21T10:01:00Z"),
      ev("confidence_check", "2026-08-21T10:02:00Z"),
      ev("some_unknown_event", "2026-08-21T10:03:00Z"),
    ];
    expect(computeXp(events)).toBe(75); // 50 + 20 + 5
  });

  it("weeklyXp counts only events on/after the week start", () => {
    const events = [
      ev("lesson_completed", "2026-08-18T10:00:00Z"), // before
      ev("lesson_completed", "2026-08-21T10:00:00Z"), // after
    ];
    expect(weeklyXp(events, new Date("2026-08-20T00:00:00Z"))).toBe(50);
  });
});
