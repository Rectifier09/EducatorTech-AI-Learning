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
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[15px] font-bold">{title}</p>
          <p className="text-[12px] text-muted">
            {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-[13px] font-extrabold text-brand-ink"
        >
          {open ? "Hide" : "View"}
        </button>
      </div>
      {open && (
        <>
          <div className="mt-3 whitespace-pre-wrap rounded-xl border border-line bg-paper p-3 text-[13px] leading-relaxed">
            {output}
          </div>
          <button
            onClick={copy}
            className="mt-2 text-[13px] font-extrabold text-brand-ink underline"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </>
      )}
    </div>
  );
}
