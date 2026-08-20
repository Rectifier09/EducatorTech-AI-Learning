"use client";

import { useState } from "react";
import { logConfidenceCheck } from "@/app/actions/lesson";
import type { ReflectionBlock } from "@/lib/content/types";

const FACES = ["😟", "😕", "🙂", "😃", "🤩"];

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
    <div className="flex flex-1 flex-col justify-center gap-6">
      <h1
        className="text-[20px] font-semibold text-balance"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {block.question}
      </h1>
      <div className="flex gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => choose(n)}
            disabled={busy}
            aria-label={`${n} of ${max}`}
            className="flex-1 rounded-xl border-[1.5px] border-line-2 bg-surface py-3 text-2xl transition hover:border-brand disabled:opacity-60"
          >
            {max === 5 ? FACES[n - 1] : n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] font-bold text-muted">
        <span>Not yet</span>
        <span>Totally</span>
      </div>
    </div>
  );
}
