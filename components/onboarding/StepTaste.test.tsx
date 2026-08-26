import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepTaste } from "./StepTaste";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/onboarding", () => ({
  completeOnboarding: vi.fn(),
}));
vi.mock("@/lib/ai/client", () => ({
  requestGenerate: vi.fn().mockResolvedValue({ text: "" }),
}));

describe("StepTaste", () => {
  it("renders the demo intro line with no mascot", () => {
    render(<StepTaste subject="Science" gradeBand="Grade 8" />);
    expect(
      screen.getByText("This is what walks out of the box — see it for your subject."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Ravi/ })).not.toBeInTheDocument();
  });
});
