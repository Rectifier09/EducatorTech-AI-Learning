import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepWelcome } from "./StepWelcome";

describe("StepWelcome", () => {
  it("greets the user by name and states the product's value, with no mascot", () => {
    render(<StepWelcome firstName="Asha" onNext={vi.fn()} />);
    expect(screen.getByText(/Asha/)).toBeInTheDocument();
    expect(
      screen.getByText("Built for the classroom, not for prompt engineers."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Ravi/ })).not.toBeInTheDocument();
  });

  it("falls back to a plain greeting when no first name is known", () => {
    render(<StepWelcome firstName={null} onNext={vi.fn()} />);
    expect(screen.getByText(/^Welcome\./)).toBeInTheDocument();
  });
});
