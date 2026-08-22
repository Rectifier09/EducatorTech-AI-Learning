import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "./CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders title, subtitle, and children, open by default", () => {
    render(
      <CollapsibleSection title="AI Foundations for Teachers" subtitle="2 / 7 lessons">
        <p>Lesson content</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText("AI Foundations for Teachers")).toBeInTheDocument();
    expect(screen.getByText("2 / 7 lessons")).toBeInTheDocument();
    expect(screen.getByText("Lesson content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles open/closed on header click", () => {
    render(
      <CollapsibleSection title="Classroom Craft" emoji="🎓">
        <p>nodes</p>
      </CollapsibleSection>,
    );
    const header = screen.getByRole("button");
    expect(header).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("can start collapsed via defaultOpen=false", () => {
    render(
      <CollapsibleSection title="Going Further" defaultOpen={false}>
        <p>later</p>
      </CollapsibleSection>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });
});
