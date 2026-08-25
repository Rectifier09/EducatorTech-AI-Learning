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
});
