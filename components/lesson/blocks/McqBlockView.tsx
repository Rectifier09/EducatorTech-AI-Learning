"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { gradeMcq } from "@/lib/lesson/grade";
import type { McqBlock } from "@/lib/content/types";

export function McqBlockView({
  block,
  onNext,
  onResult,
}: {
  block: McqBlock;
  onNext: () => void;
  onResult: (passed: boolean) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const multi = block.multi ?? false;
  const passed = gradeMcq(block, selected);

  function toggle(id: string) {
    if (checked) return;
    setSelected((cur) =>
      multi
        ? cur.includes(id)
          ? cur.filter((x) => x !== id)
          : [...cur, id]
        : [id],
    );
  }

  function check() {
    if (selected.length === 0) return;
    setChecked(true);
    onResult(gradeMcq(block, selected));
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        <h1
          className="text-[20px] font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {block.question}
        </h1>
        {multi && (
          <p className="-mt-2 text-xs text-muted">Select all that apply.</p>
        )}
        <div className="flex flex-col gap-2.5">
          {block.options.map((o) => {
            const sel = selected.includes(o.id);
            const isCorrect = block.correctIds.includes(o.id);
            let cls = "border-line-2 bg-surface";
            if (checked) {
              if (isCorrect)
                cls = "border-success bg-success-soft text-success-ink";
              else if (sel)
                cls = "border-accent bg-accent-soft text-accent-ink";
            } else if (sel) {
              cls = "border-brand bg-brand-soft text-brand-ink";
            }
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                disabled={checked}
                aria-pressed={sel}
                className={`rounded-xl border-[1.5px] px-4 py-3 text-left text-[15px] font-bold transition ${cls}`}
              >
                {o.text}
              </button>
            );
          })}
        </div>
        {checked && (
          <div
            className={`rounded-xl border p-3 text-[14px] leading-relaxed ${
              passed
                ? "border-success bg-success-soft"
                : "border-accent bg-accent-soft"
            }`}
          >
            <p className="font-bold">
              {passed ? "Exactly. 👏" : "Not quite — here's why:"}
            </p>
            <p className="mt-1">{block.explanation}</p>
          </div>
        )}
      </div>
      {checked ? (
        <Button variant="primary" onClick={onNext} className="w-full">
          Continue
        </Button>
      ) : (
        <Button
          variant="indigo"
          onClick={check}
          disabled={selected.length === 0}
          className="w-full"
        >
          Check
        </Button>
      )}
    </div>
  );
}
