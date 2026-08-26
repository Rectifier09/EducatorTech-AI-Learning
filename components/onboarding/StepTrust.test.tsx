import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepTrust } from "./StepTrust";

describe("StepTrust", () => {
  it("renders the reassurance headline/body for a skeptical attitude, with no mascot", () => {
    render(<StepTrust attitude="skeptical" onNext={vi.fn()} />);
    expect(screen.getByText("You stay in charge.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Ravi/ })).not.toBeInTheDocument();
  });

  it("renders the energised headline/body for an excited attitude", () => {
    render(<StepTrust attitude="excited" onNext={vi.fn()} />);
    expect(screen.getByText("Let's channel that.")).toBeInTheDocument();
  });
});
