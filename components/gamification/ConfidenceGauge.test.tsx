import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceGauge } from "./ConfidenceGauge";

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("ConfidenceGauge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(screen.getByRole("img", { name: /62/ })).toBeInTheDocument();
  });

  it("honors a custom label prop in the accessible name", () => {
    render(
      <ConfidenceGauge value={62} label="Team readiness" animate={false} />,
    );
    expect(
      screen.getByRole("img", { name: /Team readiness.*62/i }),
    ).toBeInTheDocument();
  });

  it("marks the inner svg as decorative (label lives on the wrapping role=img)", () => {
    render(<ConfidenceGauge value={62} animate={false} />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the chip variant", () => {
    render(<ConfidenceGauge value={62} variant="chip" animate={false} />);
    expect(screen.getByText("62")).toBeInTheDocument();
    expect(screen.getByText(/AI confidence/i)).toBeInTheDocument();
  });

  it("shows the final value immediately and skips the reveal animation when reduced motion is preferred", () => {
    mockMatchMedia(true);
    render(<ConfidenceGauge value={62} />);
    expect(screen.getByText("62")).toBeInTheDocument();
    const arc = document.querySelectorAll("circle")[1];
    expect(arc).toHaveAttribute("stroke-dashoffset", "0");
  });
});
