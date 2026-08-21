"use client";

import { useState } from "react";
import { logConfidenceCheck } from "@/app/actions/lesson";
import type { ReflectionBlock } from "@/lib/content/types";

export function ReflectionBlockView({
  block,
  lessonId,
  onNext,
}: {
  block: ReflectionBlock;
  lessonId: string;
  onNext: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const max = block.scaleMax ?? 5;

  async function choose(value: number) {
    if (busy) return;
    setBusy(true);
    // fire-and-forget: analytics must never block progress
    void logConfidenceCheck(lessonId, block.id, value);
    onNext();
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-8">
      <h1
        className="text-[20px] font-semibold text-balance"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {block.question}
      </h1>
      <div className="rounded-2xl border border-line bg-sunk p-5">
        <div className="flex items-end justify-between gap-3">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const ratio = n / max;
            const dot = 10 + ratio * 16;
            return (
              <button
                key={n}
                onClick={() => choose(n)}
                disabled={busy}
                aria-label={`${n} of ${max}`}
                className="group flex flex-1 flex-col items-center gap-2 rounded-xl py-2 transition disabled:opacity-60"
              >
                <span
                  className="rounded-full bg-gradient-to-br from-accent to-brand shadow-[var(--glow-gold)] transition group-hover:scale-110 group-focus-visible:scale-110"
                  style={{
                    width: `${dot}px`,
                    height: `${dot}px`,
                    opacity: 0.3 + ratio * 0.7,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wide text-muted">
        <span>Not yet</span>
        <span>Totally</span>
      </div>
    </div>
  );
}
