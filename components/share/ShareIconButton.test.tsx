import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareIconButton } from "./ShareIconButton";

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
  vi.spyOn(window, "open").mockImplementation(() => null);
});

describe("ShareIconButton", () => {
  it("renders nothing before the code has loaded", () => {
    getOrCreateReferralCode.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<ShareIconButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an accessible icon button once the code is ready", async () => {
    render(<ShareIconButton />);
    await waitFor(() => screen.getByRole("button", { name: "Share app" }));
  });

  it("opens the WhatsApp share link and logs a share event on click", async () => {
    render(<ShareIconButton />);
    const button = await waitFor(() => screen.getByRole("button", { name: "Share app" }));
    fireEvent.click(button);
    expect(logReferralShare).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text="),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("does not crash and stays rendering nothing when getOrCreateReferralCode rejects", async () => {
    getOrCreateReferralCode.mockRejectedValue(new Error("Could not generate a referral code"));
    const { container } = render(<ShareIconButton />);
    await waitFor(() => expect(getOrCreateReferralCode).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
