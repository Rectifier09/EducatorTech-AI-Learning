import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceGauge } from "./ConfidenceGauge";

describe("ConfidenceGauge", () => {
  it("renders the clamped value and default label", () => {
    render(<ConfidenceGauge value={62} animate={false} />);
    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText(/AI confidence/i)).toBeInTheDocument();
  });

  it("shows a positive weekly delta in a gold badge", () => {
    render(<ConfidenceGauge value={62} deltaThisWeek={8} animate={false} />);
    expect(screen.getByText(/\+8 this week/i)).toBeInTheDocument();
  });

  it("hides the delta when zero or negative", () => {
    render(<ConfidenceGauge value={62} deltaThisWeek={0} animate={false} />);
    expect(screen.queryByText(/this week/i)).toBeNull();
  });

  it("has an accessible label describing the score", () => {
    render(<ConfidenceGauge value={62} animate={false} />);
    expect(
      screen.getByRole("img", { name: /confidence.*62/i }),
    ).toBeInTheDocument();
  });
});
