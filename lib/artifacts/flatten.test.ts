import { describe, it, expect } from "vitest";
import { flattenStructuredToText } from "./flatten";

describe("flattenStructuredToText", () => {
  it("renders a nested structured object as readable text with no JSON syntax", () => {
    const text = flattenStructuredToText({
      title: "Fractions Quiz",
      questions: [
        { number: 1, prompt: "What is 1/2 + 1/4?", answer: "3/4" },
      ],
    });
    expect(text).toContain("Fractions Quiz");
    expect(text).toContain("What is 1/2 + 1/4?");
    expect(text).toContain("3/4");
    expect(text).not.toContain("{");
    expect(text).not.toContain("}");
    expect(text).not.toContain('"');
  });

  it("handles flat objects and scalars", () => {
    expect(flattenStructuredToText({ title: "Notice" })).toBe("title: Notice");
    expect(flattenStructuredToText("plain string")).toBe("plain string");
  });
});
