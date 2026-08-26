import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactHeading, Pill, ListRow } from "./primitives";

describe("artifact template primitives", () => {
  it("ArtifactHeading renders its children as the heading text", () => {
    render(<ArtifactHeading>Fractions Quiz</ArtifactHeading>);
    expect(screen.getByText("Fractions Quiz")).toBeInTheDocument();
  });

  it("Pill renders its children inside a badge", () => {
    render(<Pill>5 min</Pill>);
    expect(screen.getByText("5 min")).toBeInTheDocument();
  });

  it("ListRow renders an optional icon alongside its content", () => {
    render(<ListRow icon={<span data-testid="icon">*</span>}>Row content</ListRow>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Row content")).toBeInTheDocument();
  });

  it("ListRow renders without an icon", () => {
    render(<ListRow>No icon here</ListRow>);
    expect(screen.getByText("No icon here")).toBeInTheDocument();
  });
});
