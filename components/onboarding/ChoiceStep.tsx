"use client";

import { useState } from "react";
import { MascotGuide } from "@/components/brand/MascotGuide";

/** A single-tap choice step: mascot prompt + a column of option chips. */
export function ChoiceStep({
  prompt,
  caption,
  options,
  onSelect,
}: {
  prompt: string;
  caption?: string;
  options: string[];
  onSelect: (value: string) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(value: string) {
    if (busy) return;
    setBusy(true);
    await onSelect(value);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {caption ? <MascotGuide mood="welcome" caption={caption} /> : null}
      <h1
        className="text-[28px] leading-tight font-semibold text-balance"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {prompt}
      </h1>
      <div className="flex flex-col gap-2.5">
        {options.map((o) => (
          <button
            key={o}
            disabled={busy}
            onClick={() => pick(o)}
            className="flex min-h-[48px] items-center rounded-2xl border-[1.5px] border-line-2 bg-surface px-4 py-3.5 text-left text-[15px] font-bold text-ink shadow-[var(--elev-1)] transition hover:border-brand hover:shadow-[var(--glow-gold)] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
