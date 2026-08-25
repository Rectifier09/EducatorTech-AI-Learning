import { describe, it, expect } from "vitest";
import { extractAndValidate } from "./generateStructured";

describe("extractAndValidate", () => {
  it("parses and validates strict JSON", () => {
    const text = '{"title":"Quiz","questions":[{"number":1,"prompt":"1+1?","answer":"2"}]}';
    const result = extractAndValidate(text, "questionSet") as { title: string };
    expect(result?.title).toBe("Quiz");
  });

  it("extracts JSON wrapped in prose or markdown fences", () => {
    const text =
      'Sure! Here you go:\n```json\n{"title":"Quiz","questions":[{"number":1,"prompt":"1+1?","answer":"2"}]}\n```';
    const result = extractAndValidate(text, "questionSet") as { title: string };
    expect(result?.title).toBe("Quiz");
  });

  it("returns null on malformed JSON", () => {
    expect(extractAndValidate("not json at all", "questionSet")).toBeNull();
  });

  it("returns null when the JSON is valid but doesn't match the schema", () => {
    const text = '{"title":"Quiz","questions":[]}'; // empty questions fails .min(1)
    expect(extractAndValidate(text, "questionSet")).toBeNull();
  });

  it("returns null when the JSON matches a different archetype's shape", () => {
    const text = '{"title":"Letter","paragraphs":["Hi"]}';
    expect(extractAndValidate(text, "questionSet")).toBeNull();
  });
});
