import { describe, it, expect } from "vitest";
import { newlyEarnedBadges, didLevelUp } from "./celebrate";

const B = (id: string) => ({ id, label: id, emoji: "◆" });

describe("newlyEarnedBadges", () => {
  it("returns only badges new in after", () => {
    expect(
      newlyEarnedBadges([B("a")], [B("a"), B("b")]).map((x) => x.id),
    ).toEqual(["b"]);
  });
  it("returns empty when nothing new", () => {
    expect(newlyEarnedBadges([B("a")], [B("a")])).toEqual([]);
  });
});

describe("didLevelUp", () => {
  it("true when a threshold is crossed", () => {
    expect(didLevelUp(90, 110, [100, 250])).toBe(true);
  });
  it("false within the same band", () => {
    expect(didLevelUp(110, 140, [100, 250])).toBe(false);
  });
});
