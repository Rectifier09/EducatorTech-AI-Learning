import { describe, it, expect } from "vitest";
import { ARCHETYPE_SCHEMAS } from "./schema";

describe("ARCHETYPE_SCHEMAS", () => {
  it("questionSet accepts a valid quiz and rejects one with no questions", () => {
    const valid = {
      title: "Fractions Quiz",
      questions: [
        { number: 1, prompt: "What is 1/2 + 1/4?", answer: "3/4" },
      ],
    };
    expect(ARCHETYPE_SCHEMAS.questionSet.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.questionSet.safeParse({ title: "Empty", questions: [] })
        .success,
    ).toBe(false);
  });

  it("outline accepts a valid lesson plan and rejects a section with no bullets", () => {
    const valid = {
      title: "Photosynthesis — 40 min",
      sections: [
        { heading: "Warm-up", timeEstimate: "5 min", bullets: ["Ask what plants need to grow"] },
      ],
    };
    expect(ARCHETYPE_SCHEMAS.outline.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.outline.safeParse({
        title: "Bad",
        sections: [{ heading: "Empty section", bullets: [] }],
      }).success,
    ).toBe(false);
  });

  it("rubric accepts a valid rubric and rejects a criterion with only one level", () => {
    const valid = {
      title: "Essay Rubric",
      criteria: [
        {
          name: "Thesis",
          levels: [
            { label: "Developing", description: "States a topic" },
            { label: "Proficient", description: "States a clear argument" },
          ],
        },
      ],
    };
    expect(ARCHETYPE_SCHEMAS.rubric.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.rubric.safeParse({
        title: "Bad",
        criteria: [{ name: "Thesis", levels: [{ label: "Only one", description: "x" }] }],
      }).success,
    ).toBe(false);
  });

  it("checklist accepts a valid list and rejects an empty one", () => {
    const valid = { title: "AI-Check Checklist", items: [{ text: "Verify facts" }] };
    expect(ARCHETYPE_SCHEMAS.checklist.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.checklist.safeParse({ title: "Empty", items: [] }).success,
    ).toBe(false);
  });

  it("letter accepts a valid letter and rejects one with no paragraphs", () => {
    const valid = {
      title: "Parent Email",
      greeting: "Dear families,",
      paragraphs: ["This week we studied fractions."],
      signOff: "Warmly, Ms. Rao",
    };
    expect(ARCHETYPE_SCHEMAS.letter.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.letter.safeParse({ title: "Empty", paragraphs: [] }).success,
    ).toBe(false);
  });

  it("feedbackList accepts a valid list and rejects an empty one", () => {
    const valid = { title: "Comment Bank", items: [{ comment: "Great effort on the intro." }] };
    expect(ARCHETYPE_SCHEMAS.feedbackList.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.feedbackList.safeParse({ title: "Empty", items: [] }).success,
    ).toBe(false);
  });
});
