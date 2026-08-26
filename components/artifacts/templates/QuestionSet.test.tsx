import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionSet } from "./QuestionSet";

const sample = {
  title: "Fractions Quiz",
  instructions: "Show your work.",
  questions: [
    {
      number: 1,
      prompt: "What is 1/2 + 1/4?",
      options: ["1/4", "3/4", "1"],
      answer: "3/4",
    },
  ],
};

describe("QuestionSet", () => {
  it("renders the title, instructions, and question prompt with lettered options", () => {
    render(<QuestionSet data={sample} />);
    expect(screen.getByText("Fractions Quiz")).toBeInTheDocument();
    expect(screen.getByText("Show your work.")).toBeInTheDocument();
    expect(screen.getByText("What is 1/2 + 1/4?")).toBeInTheDocument();
    expect(screen.getByText("A) 1/4")).toBeInTheDocument();
  });

  it("hides the answer key until the toggle is clicked", () => {
    render(<QuestionSet data={sample} />);
    expect(screen.queryByText("1. 3/4")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show answer key" }));
    expect(screen.getByText("1. 3/4")).toBeInTheDocument();
  });
});
