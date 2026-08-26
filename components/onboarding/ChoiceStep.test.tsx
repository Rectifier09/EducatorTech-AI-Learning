import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChoiceStep } from "./ChoiceStep";

describe("ChoiceStep", () => {
  it("renders a value-prop line with no mascot, plus the prompt and options", () => {
    render(
      <ChoiceStep
        valueProp="Every worksheet, tuned to how you actually teach."
        prompt="What best describes you?"
        options={["Teacher", "Coordinator"]}
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Every worksheet, tuned to how you actually teach."),
    ).toBeInTheDocument();
    expect(screen.getByText("What best describes you?")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Ravi/ })).not.toBeInTheDocument();
  });

  it("calls onSelect with the tapped option", () => {
    const onSelect = vi.fn();
    render(
      <ChoiceStep
        valueProp="A value prop."
        prompt="Pick one"
        options={["Teacher", "Coordinator"]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Teacher" }));
    expect(onSelect).toHaveBeenCalledWith("Teacher");
  });
});
