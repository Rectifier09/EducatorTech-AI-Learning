"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteToolkitItem } from "@/app/actions/toolkit";
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";

export function ArtifactCard({
  id,
  title,
  output,
  createdAt,
  templateType = null,
  structured = null,
}: {
  id: string;
  title: string;
  output: string;
  createdAt: string;
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    await deleteToolkitItem(id);
    router.refresh();
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
            {new Date(createdAt).toLocaleDateString("en-US", {
              timeZone: "UTC",
            })}
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
          <div className="mt-4 max-h-64 overflow-auto rounded-2xl border border-line-2 bg-sunk p-4 text-[13px] leading-relaxed text-muted">
            <ArtifactRenderer
              templateType={templateType}
              structured={structured}
              output={output}
            />
          </div>
          <div className="mt-3 flex items-center gap-4 text-[13px] font-extrabold">
            {confirmingDelete ? (
              <>
                <span className="text-muted">Sure?</span>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="text-coral underline underline-offset-2 disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="text-brand-ink underline underline-offset-2 disabled:opacity-50"
                >
                  No
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={copy}
                  className="text-brand-ink underline underline-offset-2"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="text-coral underline underline-offset-2"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
