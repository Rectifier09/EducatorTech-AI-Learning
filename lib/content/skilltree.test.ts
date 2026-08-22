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

  it("renamed the Tech Basics branch to Reclaim Your Time with admin-time", () => {
    const t = getSkillTree();
    const branch = t.branches.find((b) => b.id === "reclaim-your-time");
    expect(branch).toBeTruthy();
    expect(branch!.label).toBe("Reclaim Your Time");
    const nodeIds = branch!.nodes.map((n) => n.id);
    expect(nodeIds).toContain("automation");
    expect(nodeIds).toContain("admin-time");
    // old id retired
    expect(nodeIds).not.toContain("tools");
    // the former branch id is gone
    expect(t.branches.some((b) => b.id === "tech-basics")).toBe(false);
  });

  it("branch nodes are not live yet (live flag is optional)", () => {
    const t = getSkillTree();
    for (const b of t.branches) {
      for (const n of b.nodes) {
        expect(n.live ?? false).toBe(false);
      }
    }
  });
});
