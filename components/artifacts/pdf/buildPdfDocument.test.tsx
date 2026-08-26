import { describe, it, expect } from "vitest";
import { buildPdfDocument } from "./buildPdfDocument";
import { QuestionSetPdf } from "./QuestionSetPdf";
import { GenericPdf } from "./GenericPdf";

describe("buildPdfDocument", () => {
  it("dispatches to the matching PDF twin when templateType and structured are present", () => {
    const structured = { title: "Quiz", questions: [{ number: 1, prompt: "1+1?", answer: "2" }] };
    const element = buildPdfDocument({ templateType: "questionSet", structured, output: "..." });
    expect(element.type).toBe(QuestionSetPdf);
    expect(element.props.data).toBe(structured);
  });

  it("falls back to GenericPdf when structured is missing", () => {
    const element = buildPdfDocument({ templateType: null, structured: null, output: "Plain text" });
    expect(element.type).toBe(GenericPdf);
    expect(element.props.output).toBe("Plain text");
  });

  it("falls back to GenericPdf when templateType is unrecognized", () => {
    const element = buildPdfDocument({
      templateType: "mystery",
      structured: { foo: "bar" },
      output: "Plain text",
    });
    expect(element.type).toBe(GenericPdf);
  });
});
