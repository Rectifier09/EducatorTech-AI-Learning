import { describe, it, expect } from "vitest";
import { getSkillTree } from "./skilltree";

describe("skill tree", () => {
  it("has a live gateway and every node is labelled with a unique id", () => {
    const t = getSkillTree();
    expect(t.gateway.live).toBe(true);
    const ids = new Set<string>();
    for (const b of t.branches) {
      for (const n of b.nodes) {
        expect(n.id).toBeTruthy();
        expect(n.label).toBeTruthy();
        expect(ids.has(n.id)).toBe(false);
        ids.add(n.id);
      }
    }
    expect(ids.size).toBeGreaterThan(0);
  });
});
