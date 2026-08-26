import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackList } from "./FeedbackList";

describe("FeedbackList", () => {
  it("renders each item's optional label and its comment", () => {
    render(
      <FeedbackList
        data={{
          title: "Comment Bank",
          items: [
            { label: "Strength", comment: "Clear topic sentences." },
            { comment: "Consider adding a conclusion." },
          ],
        }}
      />,
    );
    expect(screen.getByText("Comment Bank")).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByText("Clear topic sentences.")).toBeInTheDocument();
    expect(screen.getByText("Consider adding a conclusion.")).toBeInTheDocument();
  });
});
