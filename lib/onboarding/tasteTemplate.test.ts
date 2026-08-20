import { describe, it, expect } from "vitest";
import { buildTasteExample } from "./tasteTemplate";

describe("buildTasteExample", () => {
  it("weaves the educator's subject and grade into the shown prompt", () => {
    const { promptShown, sampleOutput } = buildTasteExample("Science", "Middle");
    expect(promptShown).toContain("Science");
    expect(promptShown).toContain("Middle");
    expect(sampleOutput.length).toBeGreaterThan(0);
  });

  it("falls back gracefully when subject is generic", () => {
    expect(() =>
      buildTasteExample("Primary (all subjects)", "Primary"),
    ).not.toThrow();
  });
});
