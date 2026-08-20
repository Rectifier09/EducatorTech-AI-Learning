import { describe, it, expect } from "vitest";
import { remainingFrom } from "./rateLimit";

describe("remainingFrom", () => {
  it("allows with full remaining at zero", () => {
    expect(remainingFrom(0, 30)).toEqual({ allowed: true, remaining: 30 });
  });
  it("blocks at the limit with zero remaining", () => {
    expect(remainingFrom(30, 30)).toEqual({ allowed: false, remaining: 0 });
  });
  it("counts remaining below the limit", () => {
    expect(remainingFrom(5, 30)).toEqual({ allowed: true, remaining: 25 });
  });
});
