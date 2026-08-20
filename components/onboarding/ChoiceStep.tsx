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
    <div className="flex flex-1 flex-col gap-5">
      {caption ? <MascotGuide mood="welcome" caption={caption} /> : null}
      <h1
        className="text-[26px] font-semibold text-balance"
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
            className="flex min-h-[48px] items-center rounded-xl border-[1.5px] border-line-2 bg-surface px-4 py-3 text-left text-[15px] font-bold transition hover:border-brand disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
