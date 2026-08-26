import { describe, it, expect } from "vitest";
import {
  formatQuestionSet,
  formatOutline,
  formatRubric,
  formatChecklist,
  formatLetter,
  formatFeedbackList,
} from "./formatArchetypeText";

describe("formatArchetypeText", () => {
  it("formats a question set with the title, numbered questions, lettered options, and an answer line", () => {
    const text = formatQuestionSet({
      title: "Quiz",
      questions: [{ number: 1, prompt: "1+1?", options: ["1", "2"], answer: "2" }],
    });
    expect(text).toContain("Quiz");
    expect(text).toContain("Q1: 1+1?");
    expect(text).toContain("A) 1");
    expect(text).toContain("B) 2");
    expect(text).toContain("Answer: 2");
  });

  it("formats an outline with the title, headings, time estimates, and indented bullets", () => {
    const text = formatOutline({
      title: "Lesson",
      sections: [{ heading: "Warm-up", timeEstimate: "5 min", bullets: ["Review"] }],
    });
    expect(text).toContain("Lesson");
    expect(text).toContain("Warm-up (5 min)");
    expect(text).toContain("- Review");
  });

  it("formats a rubric with the title, criterion names, and indented level lines", () => {
    const text = formatRubric({
      title: "Rubric",
      criteria: [
        { name: "Argument", levels: [{ label: "Strong", description: "Clear thesis." }] },
      ],
    });
    expect(text).toContain("Rubric");
    expect(text).toContain("Argument");
    expect(text).toContain("Strong: Clear thesis.");
  });

  it("formats a checklist as a title followed by bracket lines with optional notes", () => {
    const text = formatChecklist({
      title: "Checklist",
      items: [{ text: "Remove names", note: "and filenames" }, { text: "Blur faces" }],
    });
    expect(text).toBe("Checklist\n\n[ ] Remove names — and filenames\n[ ] Blur faces");
  });

  it("formats a letter with greeting, paragraphs, and sign-off (no title)", () => {
    const text = formatLetter({
      title: "Notice",
      greeting: "Dear families,",
      paragraphs: ["Field trip next week."],
      signOff: "Warmly, Ms. Rao",
    });
    expect(text).toBe("Dear families,\n\nField trip next week.\n\nWarmly, Ms. Rao");
  });

  it("formats a feedback list as a title followed by optional-label lines", () => {
    const text = formatFeedbackList({
      title: "Comment Bank",
      items: [
        { label: "Strength", comment: "Clear writing." },
        { comment: "Add a conclusion." },
      ],
    });
    expect(text).toBe("Comment Bank\n\nStrength: Clear writing.\nAdd a conclusion.");
  });
});
