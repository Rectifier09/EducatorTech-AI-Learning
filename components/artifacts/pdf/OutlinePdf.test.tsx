// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { OutlinePdf } from "./OutlinePdf";

describe("OutlinePdf", () => {
  it("builds a PDF from a typical outline without throwing", async () => {
    await expect(
      pdf(
        <OutlinePdf
          data={{
            title: "Fractions Lesson",
            sections: [
              { heading: "Warm-up", timeEstimate: "5 min", bullets: ["Review prior work"] },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF when timeEstimate is omitted", async () => {
    await expect(
      pdf(
        <OutlinePdf
          data={{ title: "Fractions Lesson", sections: [{ heading: "Warm-up", bullets: ["Review"] }] }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
