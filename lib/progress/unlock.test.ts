import { describe, it, expect } from "vitest";
import { deriveLessonStates } from "./unlock";
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

describe("deriveLessonStates", () => {
  it("makes only lesson 1 active when nothing is done", () => {
    expect(deriveLessonStates(ids, {})).toEqual([
      { lessonId: "l1", state: "active" },
      { lessonId: "l2", state: "locked" },
      { lessonId: "l3", state: "locked" },
    ]);
  });

  it("unlocks the next lesson after the prior completes", () => {
    const states = deriveLessonStates(ids, { l1: completed("l1") });
    expect(states.map((s) => s.state)).toEqual([
      "completed",
      "active",
      "locked",
    ]);
  });
});
