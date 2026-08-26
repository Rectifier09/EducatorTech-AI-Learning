// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { LetterPdf } from "./LetterPdf";

describe("LetterPdf", () => {
  it("builds a PDF from a typical letter without throwing", async () => {
    await expect(
      pdf(
        <LetterPdf
          data={{
            title: "Parent Email",
            greeting: "Dear families,",
            paragraphs: ["We have a field trip next week."],
            signOff: "Warmly, Ms. Rao",
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF when greeting and signOff are omitted", async () => {
    await expect(
      pdf(<LetterPdf data={{ title: "Notice", paragraphs: ["School closes early Friday."] }} />).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
