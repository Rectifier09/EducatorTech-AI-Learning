import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Rubric } from "./Rubric";

describe("Rubric", () => {
  it("renders each criterion's name and its levels' labels and descriptions", () => {
    render(
      <Rubric
        data={{
          title: "Essay Rubric",
          criteria: [
            {
              name: "Argument",
              levels: [
                { label: "Strong", description: "Clear thesis throughout." },
                { label: "Developing", description: "Thesis present but unclear." },
              ],
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Essay Rubric")).toBeInTheDocument();
    expect(screen.getByText("Argument")).toBeInTheDocument();
    expect(screen.getByText("Strong:")).toBeInTheDocument();
    expect(screen.getByText("Clear thesis throughout.")).toBeInTheDocument();
  });
});
