import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { formatLightMarkdown } from "./formatText";

describe("formatLightMarkdown", () => {
  it("renders **bold** as a real <strong>, not literal asterisks", () => {
    const { container } = render(<div>{formatLightMarkdown("This is **important**.")}</div>);
    expect(container.querySelector("strong")?.textContent).toBe("important");
    expect(container.textContent).not.toContain("**");
  });

  it("renders a '### heading' line as bold text, not literal hashes", () => {
    const { container } = render(<div>{formatLightMarkdown("### Instructions")}</div>);
    expect(container.textContent).toContain("Instructions");
    expect(container.textContent).not.toContain("#");
  });

  it("preserves plain lines with no markdown untouched", () => {
    const { container } = render(<div>{formatLightMarkdown("Just a plain sentence.")}</div>);
    expect(container.textContent).toContain("Just a plain sentence.");
  });
});
