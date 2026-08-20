import { describe, it, expect, vi } from "vitest";

const generate = vi.fn();
vi.mock("./service", () => ({ generate: (i: unknown) => generate(i) }));

import { gradePrompt, parseGrade } from "./gradePrompt";

describe("parseGrade", () => {
  it("parses strict JSON", () => {
    const g = parseGrade(
      '{"pass":true,"feedback":"Nice","met":["task"],"missing":[]}',
    );
    expect(g).toEqual({
      pass: true,
      feedback: "Nice",
      met: ["task"],
      missing: [],
    });
  });

  it("extracts JSON wrapped in prose/markdown", () => {
    const g = parseGrade('Sure!\n```json\n{"pass":false,"feedback":"Add context"}\n```');
    expect(g.pass).toBe(false);
    expect(g.feedback).toBe("Add context");
  });

  it("falls back safely on malformed output", () => {
    const g = parseGrade("totally not json");
    expect(g.pass).toBe(true);
    expect(g.feedback.length).toBeGreaterThan(0);
  });
});

describe("gradePrompt", () => {
  it("grades via the model and parses the result", async () => {
    generate.mockResolvedValue({
      text: '{"pass":true,"feedback":"Clear task + context","met":["task","context"],"missing":[]}',
      provider: "gemini",
    });
    const g = await gradePrompt({
      brief: "Write a prompt",
      rubric: ["has a task", "has context"],
      submission: "Make a Grade 7 science worksheet on photosynthesis",
    });
    expect(g).toMatchObject({ pass: true, met: ["task", "context"] });
  });

  it("returns the safe fallback if the model throws", async () => {
    generate.mockRejectedValue(new Error("provider down"));
    const g = await gradePrompt({ brief: "b", rubric: ["x"], submission: "y" });
    expect(g.pass).toBe(true);
  });
});
