import { describe, it, expect } from "vitest";
import { gradeMcq, gradeOrder, gradeFillBlank } from "./grade";
import type {
  McqBlock,
  OrderBlock,
  FillBlankBlock,
} from "@/lib/content/types";

describe("grading", () => {
  it("mcq passes only on the exact correct set (order-independent)", () => {
    expect(gradeMcq({ correctIds: ["b"] } as McqBlock, ["b"])).toBe(true);
    expect(gradeMcq({ correctIds: ["b"] } as McqBlock, ["a"])).toBe(false);
    expect(gradeMcq({ correctIds: ["a", "c"] } as McqBlock, ["c", "a"])).toBe(
      true,
    );
    expect(gradeMcq({ correctIds: ["a", "c"] } as McqBlock, ["a"])).toBe(false);
  });

  it("order passes only on the exact sequence", () => {
    const b = { correctOrder: ["x", "y", "z"] } as OrderBlock;
    expect(gradeOrder(b, ["x", "y", "z"])).toBe(true);
    expect(gradeOrder(b, ["y", "x", "z"])).toBe(false);
  });

  it("fillBlank requires every blank correct", () => {
    const b = {
      blanks: [
        { id: "1", correctIndex: 2 },
        { id: "2", correctIndex: 0 },
      ],
    } as FillBlankBlock;
    expect(gradeFillBlank(b, { "1": 2, "2": 0 })).toBe(true);
    expect(gradeFillBlank(b, { "1": 2, "2": 1 })).toBe(false);
  });
});
