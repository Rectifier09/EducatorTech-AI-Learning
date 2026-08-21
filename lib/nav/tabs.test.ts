import { describe, it, expect } from "vitest";
import { activeTab } from "./tabs";
describe("activeTab", () => {
  it("maps learn routes", () => { expect(activeTab("/learn")).toBe("learn"); });
  it("maps create surfaces", () => {
    expect(activeTab("/create")).toBe("create");
    expect(activeTab("/playground")).toBe("create");
    expect(activeTab("/toolkit")).toBe("create");
  });
  it("maps you surfaces", () => {
    expect(activeTab("/you")).toBe("you");
    expect(activeTab("/leaderboard")).toBe("you");
  });
  it("hides the bar in a lesson or onboarding", () => {
    expect(activeTab("/lesson/l1")).toBeNull();
    expect(activeTab("/onboarding")).toBeNull();
  });
});
