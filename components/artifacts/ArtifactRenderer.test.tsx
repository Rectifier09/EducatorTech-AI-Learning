import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactRenderer } from "./ArtifactRenderer";

describe("ArtifactRenderer", () => {
  it("renders Generic when templateType is null", () => {
    render(<ArtifactRenderer templateType={null} output="Plain **text**." />);
    expect(screen.getByText("text").tagName).toBe("STRONG");
  });

  it("renders Generic for an unrecognized templateType (forward-compat placeholder)", () => {
    render(<ArtifactRenderer templateType="somethingNotBuiltYet" output="Fallback **content**." />);
    expect(screen.getByText("content").tagName).toBe("STRONG");
  });

  it("renders QuestionSet when templateType is questionSet", () => {
    render(
      <ArtifactRenderer
        templateType="questionSet"
        structured={{
          title: "Quiz",
          questions: [{ number: 1, prompt: "1+1?", answer: "2" }],
        }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("1+1?")).toBeInTheDocument();
  });

  it("renders Outline when templateType is outline", () => {
    render(
      <ArtifactRenderer
        templateType="outline"
        structured={{ title: "Lesson", sections: [{ heading: "Warm-up", bullets: ["Review"] }] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Warm-up")).toBeInTheDocument();
  });

  it("renders Rubric when templateType is rubric", () => {
    render(
      <ArtifactRenderer
        templateType="rubric"
        structured={{
          title: "Rubric",
          criteria: [{ name: "Argument", levels: [{ label: "Strong", description: "Clear." }] }],
        }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Argument")).toBeInTheDocument();
  });

  it("renders Checklist when templateType is checklist", () => {
    render(
      <ArtifactRenderer
        templateType="checklist"
        structured={{ title: "Checklist", items: [{ text: "Remove names" }] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Remove names")).toBeInTheDocument();
  });

  it("renders Letter when templateType is letter", () => {
    render(
      <ArtifactRenderer
        templateType="letter"
        structured={{ title: "Notice", paragraphs: ["Field trip next week."] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Field trip next week.")).toBeInTheDocument();
  });

  it("renders FeedbackList when templateType is feedbackList", () => {
    render(
      <ArtifactRenderer
        templateType="feedbackList"
        structured={{ title: "Comment Bank", items: [{ comment: "Nice work." }] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Nice work.")).toBeInTheDocument();
  });

  it("renders Generic when templateType is set but structured is missing", () => {
    render(
      <ArtifactRenderer templateType="questionSet" output="Plain **fallback**." />,
    );
    expect(screen.getByText("fallback").tagName).toBe("STRONG");
  });
});
