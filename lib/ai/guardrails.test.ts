import { describe, it, expect } from "vitest";
import { buildSystemPrompt, isLikelyOffTopic } from "./guardrails";

describe("buildSystemPrompt", () => {
  it("injects the subject and scopes to teaching/education", () => {
    const p = buildSystemPrompt(
      { role: "School teacher", subject: "Science", gradeBand: "Middle" },
      "playground",
    );
    expect(p).toContain("Science");
    expect(p.toLowerCase()).toMatch(/teaching|education/);
  });

  it("adds JSON-only instruction in grade mode", () => {
    const p = buildSystemPrompt(
      { role: null, subject: null, gradeBand: null },
      "grade",
    );
    expect(p).toMatch(/JSON/);
  });

  it("appends the archetype's JSON instruction when one is given", () => {
    const p = buildSystemPrompt(
      { role: null, subject: null, gradeBand: null },
      "playground",
      "questionSet",
    );
    expect(p).toMatch(/JSON/);
    expect(p).toMatch(/questions/);
  });

  it("has no archetype instruction when none is given", () => {
    const p = buildSystemPrompt(
      { role: null, subject: null, gradeBand: null },
      "playground",
    );
    expect(p).not.toMatch(/JSON/);
  });
});

describe("isLikelyOffTopic", () => {
  it("flags empty input", () => {
    expect(isLikelyOffTopic("")).toBe(true);
  });
  it("passes a normal teaching request", () => {
    expect(
      isLikelyOffTopic("Make a Grade 7 science worksheet on photosynthesis"),
    ).toBe(false);
  });
});
