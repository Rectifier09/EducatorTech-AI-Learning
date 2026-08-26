// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { GenericPdf } from "./GenericPdf";

describe("GenericPdf", () => {
  it("builds a PDF from plain text without throwing", async () => {
    await expect(
      pdf(<GenericPdf output={"Line one\nLine two"} />).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF from empty text without throwing", async () => {
    await expect(pdf(<GenericPdf output={""} />).toBuffer()).resolves.toBeTruthy();
  });

  it("strips heading markers and renders bold spans instead of literal markdown", () => {
    const element = GenericPdf({ output: "### Heading\nHere is **bold** text." });
    const rendered = JSON.stringify(element);
    expect(rendered).not.toContain("###");
    expect(rendered).not.toContain("**");
    expect(rendered).toContain("Heading");
    expect(rendered).toContain("bold");
  });
});
