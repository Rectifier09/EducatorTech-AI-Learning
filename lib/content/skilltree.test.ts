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

  it("only the deliberately-launched nodes are live (live flag is optional)", () => {
    // Nodes go live only after human content review — update this set when a
    // node is intentionally launched. Guards against an authoring agent (or a
    // stray edit) flipping `live` by accident, in either direction.
    const LIVE = new Set([
      "grading",
      "differentiation",
      "parent-comms",
      "scepticism",
      "misuse",
      "privacy",
      "automation",
      "admin-time",
      "build-helper",
      "leading",
    ]);
    const t = getSkillTree();
    for (const b of t.branches) {
      for (const n of b.nodes) {
        expect(Boolean(n.live)).toBe(LIVE.has(n.id));
      }
    }
  });
});
