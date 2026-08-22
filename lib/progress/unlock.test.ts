import { describe, it, expect } from "vitest";
import { deriveLessonStates, progressKey } from "./unlock";
import type { LessonProgress } from "@/lib/data/types";

const ids = ["l1", "l2", "l3"];
const completed = (lessonId: string): LessonProgress => ({
  lessonId,
  userId: "u",
  status: "completed",
  score: 100,
  attempts: 1,
  completedAt: "now",
});

describe("progressKey", () => {
  it("namespaces a lesson id by its track", () => {
    expect(progressKey("ai-foundations", "l1")).toBe("ai-foundations:l1");
  });
});

describe("deriveLessonStates", () => {
  it("makes only lesson 1 active when nothing is done", () => {
    expect(deriveLessonStates("ai-foundations", ids, {})).toEqual([
      { lessonId: "l1", state: "active" },
      { lessonId: "l2", state: "locked" },
      { lessonId: "l3", state: "locked" },
    ]);
  });

  it("unlocks the next lesson after the prior completes (namespaced lookup)", () => {
    const states = deriveLessonStates("ai-foundations", ids, {
      [progressKey("ai-foundations", "l1")]: completed("ai-foundations:l1"),
    });
    expect(states.map((s) => s.state)).toEqual([
      "completed",
      "active",
      "locked",
    ]);
  });

  it("ignores a bare (un-namespaced) key — orphaned legacy rows don't unlock", () => {
    const states = deriveLessonStates("ai-foundations", ids, {
      l1: completed("l1"),
    });
    expect(states.map((s) => s.state)).toEqual(["active", "locked", "locked"]);
  });

  it("keeps tracks independent — another track's progress doesn't leak", () => {
    // Completing beta:l1 must not affect ai-foundations unlock state.
    const states = deriveLessonStates("ai-foundations", ids, {
      [progressKey("beta", "l1")]: completed("beta:l1"),
    });
    expect(states.map((s) => s.state)).toEqual(["active", "locked", "locked"]);
  });
});
