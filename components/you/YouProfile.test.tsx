import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { YouProfile } from "./YouProfile";

vi.mock("@/app/actions/referral", () => ({
  getOrCreateReferralCode: vi.fn(() => Promise.resolve("test-code")),
  logReferralShare: vi.fn(),
}));

const baseProps = {
  firstName: "Asha",
  confidence: 60,
  xp: 100,
  streak: 3,
  badges: [],
  league: [],
  daysLeft: 2,
  isAdmin: false,
  setAlias: vi.fn(),
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
};

describe("YouProfile", () => {
  it("renders the share prompt", async () => {
    render(<YouProfile {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByText("Know a teacher who'd love this?")).toBeInTheDocument();
    });
  });
});
