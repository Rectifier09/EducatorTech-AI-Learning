import { describe, it, expect } from "vitest";
import { nextLessonTarget } from "./continue";

const S = (lessonId: string, state: "completed" | "active" | "locked") => ({
  lessonId,
  state,
});

describe("nextLessonTarget", () => {
  it("returns the active lesson", () => {
    expect(
      nextLessonTarget([S("l1", "completed"), S("l2", "active"), S("l3", "locked")]),
    ).toBe("l2");
  });
  it("falls back to the first locked when none active", () => {
    expect(nextLessonTarget([S("l1", "completed"), S("l2", "locked")])).toBe(
      "l2",
    );
  });
  it("returns null when all complete", () => {
    expect(nextLessonTarget([S("l1", "completed")])).toBeNull();
  });
});
