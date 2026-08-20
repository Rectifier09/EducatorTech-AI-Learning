import { describe, it, expect } from "vitest";
import { artifactTitle } from "./toolkit";

describe("artifactTitle", () => {
  it("derives 'Type · Topic' from the type + prompt", () => {
    expect(
      artifactTitle({
        artifactType: "Worksheet",
        prompt: "Make a worksheet on Photosynthesis for a Grade 7 class",
        createdAt: "2026-08-21T00:00:00Z",
      }),
    ).toBe("Worksheet · Photosynthesis");
  });

  it("falls back to a dated title when type + topic are missing", () => {
    const t = artifactTitle({
      artifactType: null,
      prompt: "some text with no clear topic",
      createdAt: "2026-08-21T00:00:00Z",
    });
    expect(t).toMatch(/Creation/);
  });
});
