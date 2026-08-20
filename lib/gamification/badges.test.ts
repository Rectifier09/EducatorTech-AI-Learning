import { describe, it, expect } from "vitest";
import { earnedBadges } from "./badges";

const allDone = Object.fromEntries(
  ["l1", "l2", "l3", "l4", "l5", "l6", "l7"].map((id) => [
    id,
    { status: "completed" as const },
  ]),
);

describe("earnedBadges", () => {
  it("awards Foundations when all 7 lessons are complete", () => {
    const ids = earnedBadges({
      progress: allDone,
      events: [],
      streakCurrent: 1,
    }).map((b) => b.id);
    expect(ids).toContain("foundations");
  });

  it("awards nothing lesson-based when nothing is done", () => {
    const ids = earnedBadges({
      progress: {},
      events: [],
      streakCurrent: 0,
    }).map((b) => b.id);
    expect(ids).not.toContain("foundations");
    expect(ids).not.toContain("sceptic");
  });

  it("awards First Draft from a saved artifact", () => {
    const ids = earnedBadges({
      progress: {},
      events: [{ name: "artifact_saved" }],
      streakCurrent: 0,
    }).map((b) => b.id);
    expect(ids).toContain("first-draft");
  });
});
