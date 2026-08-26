"use client";

import { useState } from "react";

export function DownloadPdfButton({
  templateType,
  structured,
  output,
}: {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setBusy(true);
    setError(false);
    try {
      const [{ pdf }, { buildPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf/buildPdfDocument"),
      ]);
      const blob = await pdf(
        buildPdfDocument({ templateType, structured, output }),
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "artifact.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={download}
        disabled={busy}
        className="text-[13px] font-extrabold text-brand-ink underline underline-offset-2 disabled:opacity-50"
      >
        {busy ? "Preparing PDF…" : "Download PDF"}
      </button>
      {error && <p className="text-[12px] text-coral">Couldn&apos;t create the PDF — try again.</p>}
    </div>
  );
}
