import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DownloadPdfButton } from "./DownloadPdfButton";

const toBlob = vi.fn();

vi.mock("@react-pdf/renderer", () => ({
  pdf: () => ({ toBlob: () => toBlob() }),
  Document: ({ children }: { children?: unknown }) => children,
  Page: ({ children }: { children?: unknown }) => children,
  Text: ({ children }: { children?: unknown }) => children,
  View: ({ children }: { children?: unknown }) => children,
  StyleSheet: { create: (styles: unknown) => styles },
}));

beforeEach(() => {
  vi.clearAllMocks();
  toBlob.mockResolvedValue(new Blob(["fake pdf"]));
  global.URL.createObjectURL = vi.fn(() => "blob:fake");
  global.URL.revokeObjectURL = vi.fn();
});

describe("DownloadPdfButton", () => {
  it("triggers a blob download when clicked", async () => {
    render(<DownloadPdfButton templateType={null} structured={null} output="Plain text" />);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(toBlob).toHaveBeenCalled());
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("shows an inline error when PDF generation fails", async () => {
    toBlob.mockRejectedValue(new Error("boom"));
    render(<DownloadPdfButton templateType={null} structured={null} output="Plain text" />);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(screen.getByText("Couldn't create the PDF — try again.")).toBeInTheDocument(),
    );
  });
});
