// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { QuestionSetPdf } from "./QuestionSetPdf";

describe("QuestionSetPdf", () => {
  it("builds a PDF from a typical question set without throwing", async () => {
    await expect(
      pdf(
        <QuestionSetPdf
          data={{
            title: "Quiz",
            instructions: "Show your work.",
            questions: [
              { number: 1, prompt: "1+1?", options: ["1", "2"], answer: "2" },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF when optional fields are omitted", async () => {
    await expect(
      pdf(
        <QuestionSetPdf
          data={{ title: "Quiz", questions: [{ number: 1, prompt: "1+1?", answer: "2" }] }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
