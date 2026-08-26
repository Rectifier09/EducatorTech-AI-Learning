// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { FeedbackListPdf } from "./FeedbackListPdf";

describe("FeedbackListPdf", () => {
  it("builds a PDF from a typical feedback list without throwing", async () => {
    await expect(
      pdf(
        <FeedbackListPdf
          data={{
            title: "Comment Bank",
            items: [
              { label: "Strength", comment: "Clear topic sentences." },
              { comment: "Consider adding a conclusion." },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
