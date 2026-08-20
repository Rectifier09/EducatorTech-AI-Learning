import { describe, it, expect } from "vitest";
import {
  initSession,
  advance,
  computeScore,
  personalize,
} from "./session";
import type { Lesson } from "@/lib/content/types";

const lessonWith = (n: number) =>
  ({ blocks: Array.from({ length: n }, (_, i) => ({ id: `b${i}` })) }) as Lesson;

describe("lesson session", () => {
  it("starts at block 0, not done", () => {
    const s = initSession(lessonWith(2));
    expect(s.index).toBe(0);
    expect(s.done).toBe(false);
  });

  it("marks done when advancing past the last block", () => {
    let s = initSession(lessonWith(2));
    s = advance(s, 2);
    s = advance(s, 2);
    expect(s.done).toBe(true);
  });

  it("scores the percentage of gradable results that passed", () => {
    expect(computeScore({ a: true, b: false, c: true })).toBe(67);
  });

  it("scores 100 when there are no gradable results", () => {
    expect(computeScore({})).toBe(100);
  });

  it("personalizes subject/grade tokens with fallbacks", () => {
    expect(
      personalize("For {{gradeBand}} {{subject}}", {
        subject: "Science",
        gradeBand: "Middle",
      }),
    ).toBe("For Middle Science");
    expect(personalize("For {{subject}}", { subject: null, gradeBand: null })).toContain(
      "your class",
    );
  });
});
