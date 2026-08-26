import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Outline } from "./Outline";

describe("Outline", () => {
  it("renders each section's heading, time estimate, and bullets", () => {
    render(
      <Outline
        data={{
          title: "Fractions Lesson",
          sections: [
            { heading: "Warm-up", timeEstimate: "5 min", bullets: ["Review prior work"] },
          ],
        }}
      />,
    );
    expect(screen.getByText("Fractions Lesson")).toBeInTheDocument();
    expect(screen.getByText("Warm-up")).toBeInTheDocument();
    expect(screen.getByText("5 min")).toBeInTheDocument();
    expect(screen.getByText("Review prior work")).toBeInTheDocument();
  });

  it("omits the pill when timeEstimate is absent", () => {
    render(
      <Outline
        data={{
          title: "Fractions Lesson",
          sections: [{ heading: "Warm-up", bullets: ["Review prior work"] }],
        }}
      />,
    );
    expect(screen.queryByText(/min$/)).not.toBeInTheDocument();
  });
});
