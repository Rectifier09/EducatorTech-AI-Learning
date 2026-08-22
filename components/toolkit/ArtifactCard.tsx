"use client";

import { useState } from "react";

export function ArtifactCard({
  title,
  output,
  createdAt,
}: {
  title: string;
  output: string;
  createdAt: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--elev-1)] transition hover:shadow-[var(--elev-2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p
            className="text-[16px] font-semibold text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </p>
          <p className="text-[12px] text-faint">
            {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-full border border-line-2 px-3.5 py-1.5 text-[12px] font-extrabold text-brand-ink transition hover:border-brand"
        >
          {open ? "Hide" : "View"}
        </button>
      </div>
      {open && (
        <>
          <div className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-line-2 bg-sunk p-4 text-[13px] leading-relaxed text-muted">
            {output}
          </div>
          <button
            onClick={copy}
            className="mt-3 text-[13px] font-extrabold text-brand-ink underline underline-offset-2"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </>
      )}
    </div>
  );
}
