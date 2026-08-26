import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareApp } from "./ShareApp";

const getOrCreateReferralCode = vi.fn();
const logReferralShare = vi.fn();

vi.mock("@/app/actions/referral", () => ({
  getOrCreateReferralCode: () => getOrCreateReferralCode(),
  logReferralShare: () => logReferralShare(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getOrCreateReferralCode.mockResolvedValue("ABCD1234");
  logReferralShare.mockResolvedValue(undefined);
});

describe("ShareApp", () => {
  it("renders the referral link and a correctly-encoded WhatsApp share link", async () => {
    render(<ShareApp />);
    await waitFor(() => screen.getByText(/\/r\/ABCD1234/));
    const link = screen.getByRole("link", { name: "Share on WhatsApp" });
    const href = link.getAttribute("href")!;
    expect(href).toContain("https://wa.me/?text=");
    expect(decodeURIComponent(href.split("?text=")[1])).toContain("/r/ABCD1234");
  });

  it("logs a share event when the WhatsApp link is clicked", async () => {
    render(<ShareApp />);
    await waitFor(() => screen.getByRole("link", { name: "Share on WhatsApp" }));
    fireEvent.click(screen.getByRole("link", { name: "Share on WhatsApp" }));
    expect(logReferralShare).toHaveBeenCalled();
  });

  it("renders nothing before the code has loaded", () => {
    getOrCreateReferralCode.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<ShareApp />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not crash and stays rendering nothing when getOrCreateReferralCode rejects", async () => {
    getOrCreateReferralCode.mockRejectedValue(new Error("Could not generate a referral code"));
    const { container } = render(<ShareApp />);
    await waitFor(() => expect(getOrCreateReferralCode).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
