import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Generic } from "./Generic";

describe("Generic", () => {
  it("renders the output text with markdown formatted, not literal", () => {
    render(<Generic output="Here is your **worksheet**." />);
    expect(screen.getByText("worksheet").tagName).toBe("STRONG");
  });
});
