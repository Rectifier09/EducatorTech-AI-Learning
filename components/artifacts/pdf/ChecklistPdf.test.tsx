// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { ChecklistPdf } from "./ChecklistPdf";

describe("ChecklistPdf", () => {
  it("builds a PDF from a typical checklist without throwing", async () => {
    await expect(
      pdf(
        <ChecklistPdf
          data={{
            title: "De-identify Checklist",
            items: [
              { text: "Remove student names", note: "including in filenames" },
              { text: "Blur faces in photos" },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
