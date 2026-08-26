import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LessonComplete } from "./LessonComplete";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/referral", () => ({
  getOrCreateReferralCode: vi.fn(() => Promise.resolve("test-code")),
  logReferralShare: vi.fn(),
}));

// jsdom does not implement the Web Animations API. RewardMoment always
// mounts GoldBurst, which calls Element.animate() on mount — stub it so
// mounting RewardMoment here doesn't throw. This is a test-environment
// shim only; it doesn't touch RewardMoment/GoldBurst source.
beforeAll(() => {
  if (typeof Element.prototype.animate !== "function") {
    Element.prototype.animate = () => ({ onfinish: null }) as unknown as Animation;
  }
});

describe("LessonComplete", () => {
  it("shows the share prompt on the standard lesson-complete moment", async () => {
    render(<LessonComplete score={100} nextHref="/lesson/next" />);
    await waitFor(() => {
      expect(screen.getByText("Know a teacher who'd love this?")).toBeInTheDocument();
    });
  });

  it("does not show the share prompt on the badge-unlock moment", () => {
    render(
      <LessonComplete
        score={100}
        nextHref="/lesson/next"
        newBadges={[{ id: "b1", label: "First Win", emoji: "🏅" }]}
      />,
    );
    expect(screen.queryByText("Know a teacher who'd love this?")).not.toBeInTheDocument();
  });
});
