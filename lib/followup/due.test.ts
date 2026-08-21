import { describe, it, expect } from "vitest";
import { isFollowUpDue } from "./due";

describe("isFollowUpDue", () => {
  it("is due after the committed day", () => {
    expect(isFollowUpDue("2026-08-19", "2026-08-20")).toBe(true);
  });
  it("is not due on the committed day", () => {
    expect(isFollowUpDue("2026-08-20", "2026-08-20")).toBe(false);
  });
  it("is not due before the committed day", () => {
    expect(isFollowUpDue("2026-08-22", "2026-08-20")).toBe(false);
  });
});
