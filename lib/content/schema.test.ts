import { describe, it, expect } from "vitest";
import { validateLesson } from "./schema";

const good = {
  id: "l1",
  title: "What AI is",
  estMinutes: 4,
  goal: "Demystify AI",
  blocks: [
    { type: "theory", id: "t1", body: "AI guesses words." },
    {
      type: "mcq",
      id: "m1",
      question: "AI always tells the truth?",
      options: [
        { id: "a", text: "True" },
        { id: "b", text: "False" },
      ],
      correctIds: ["b"],
      explanation: "It can be confidently wrong.",
    },
  ],
};

describe("validateLesson", () => {
  it("accepts a well-formed lesson", () => {
    expect(validateLesson(good).id).toBe("l1");
  });

  it("rejects an mcq whose correctIds is empty", () => {
    const bad = structuredClone(good);
    (bad.blocks[1] as { correctIds: string[] }).correctIds = [];
    expect(() => validateLesson(bad)).toThrow();
  });

  it("rejects an unknown block type", () => {
    const bad = structuredClone(good);
    (bad.blocks as unknown[]).push({ type: "video", id: "v1" });
    expect(() => validateLesson(bad)).toThrow();
  });
});
