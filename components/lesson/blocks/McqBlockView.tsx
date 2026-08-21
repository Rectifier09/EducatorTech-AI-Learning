"use client";

import { useRef, useState } from "react";
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
  const [solved, setSolved] = useState(false);
  const [wrongTry, setWrongTry] = useState(false);
  const firstScored = useRef(false);
  const multi = block.multi ?? false;

  function toggle(id: string) {
    if (solved) return;
    setWrongTry(false);
    setSelected((cur) =>
      multi
        ? cur.includes(id)
          ? cur.filter((x) => x !== id)
          : [...cur, id]
        : [id],
    );
  }

  function check() {
    if (selected.length === 0 || solved) return;
    const ok = gradeMcq(block, selected);
    // Score the first attempt only (honest first-try signal); retries still allowed.
    if (!firstScored.current) {
      firstScored.current = true;
      onResult(ok);
    }
    if (ok) setSolved(true);
    else setWrongTry(true);
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
            let cls = "border-line-2 bg-surface";
            if (solved && sel) {
              cls = "border-success bg-success-soft text-success-ink";
            } else if (sel) {
              cls = "border-brand bg-brand-soft text-brand-ink";
            }
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                disabled={solved}
                aria-pressed={sel}
                className={`flex items-center justify-between gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left text-[15px] font-bold transition ${cls}`}
              >
                <span>{o.text}</span>
                {solved && sel && (
                  <span className="shrink-0 text-[13px]">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {solved && (
          <div className="rounded-xl border border-success bg-success-soft p-3 text-[14px] leading-relaxed">
            <p className="font-bold">Exactly. 👏</p>
            <p className="mt-1">{block.explanation}</p>
          </div>
        )}
        {wrongTry && !solved && (
          <div className="rounded-xl border border-accent bg-accent-soft p-3 text-[14px]">
            <p className="font-bold">Not quite — take another look.</p>
            {multi && (
              <p className="mt-1 text-muted">
                Tip: it&apos;s more than one, and not all of them.
              </p>
            )}
          </div>
        )}
      </div>

      {solved ? (
        <Button variant="primary" onClick={onNext} className="w-full">
          Continue
        </Button>
      ) : (
        <Button
          variant="primary"
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
