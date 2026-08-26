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
});
