import { describe, it, expect } from "vitest";
import { buildReferralLink, buildWhatsappShareHref } from "./shareMessage";

describe("buildReferralLink", () => {
  it("joins the origin and code into a /r/<code> link", () => {
    expect(buildReferralLink("https://sahajaividya.vercel.app", "ABCD1234")).toBe(
      "https://sahajaividya.vercel.app/r/ABCD1234",
    );
  });
});

describe("buildWhatsappShareHref", () => {
  it("builds a wa.me link with the referral link URL-encoded into the message", () => {
    const href = buildWhatsappShareHref("https://sahajaividya.vercel.app", "ABCD1234");
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const encodedLink = encodeURIComponent(
      buildReferralLink("https://sahajaividya.vercel.app", "ABCD1234"),
    );
    expect(href).toContain(encodedLink);
  });
});
