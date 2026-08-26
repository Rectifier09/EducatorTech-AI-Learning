// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { RubricPdf } from "./RubricPdf";

describe("RubricPdf", () => {
  it("builds a PDF from a typical rubric without throwing", async () => {
    await expect(
      pdf(
        <RubricPdf
          data={{
            title: "Essay Rubric",
            criteria: [
              {
                name: "Argument",
                levels: [{ label: "Strong", description: "Clear thesis throughout." }],
              },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
