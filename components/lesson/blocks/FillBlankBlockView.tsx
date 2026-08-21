"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { gradeFillBlank } from "@/lib/lesson/grade";
import type { FillBlankBlock } from "@/lib/content/types";

export function FillBlankBlockView({
  block,
  onNext,
  onResult,
}: {
  block: FillBlankBlock;
  onNext: () => void;
  onResult: (passed: boolean) => void;
}) {
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [solved, setSolved] = useState(false);
  const [wrongTry, setWrongTry] = useState(false);
  const firstScored = useRef(false);

  const blanksById = new Map(block.blanks.map((b) => [b.id, b]));
  const allChosen = block.blanks.every((b) => choices[b.id] !== undefined);
  const parts = block.template.split(/(\{\{[^}]+\}\})/g);

  function pick(blankId: string, idx: number) {
    if (solved) return;
    setWrongTry(false);
    setChoices((c) => ({ ...c, [blankId]: idx }));
  }

  function check() {
    if (!allChosen || solved) return;
    const ok = gradeFillBlank(block, choices);
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
        <p className="text-[16px] leading-[2.2]">
          {parts.map((part, i) => {
            const m = part.match(/^\{\{([^}]+)\}\}$/);
            const blank = m ? blanksById.get(m[1]) : undefined;
            if (!blank) return <span key={i}>{part}</span>;
            const chosen = choices[blank.id];
            return (
              <select
                key={i}
                value={chosen ?? ""}
                onChange={(e) => pick(blank.id, Number(e.target.value))}
                disabled={solved}
                className={`mx-1 rounded-lg border-[1.5px] px-2 py-1 text-[14px] font-bold ${
                  solved
                    ? "border-success bg-success-soft text-success-ink"
                    : chosen !== undefined
                      ? "border-brand bg-brand-soft text-brand-ink"
                      : "border-line-2 bg-surface"
                }`}
              >
                <option value="" disabled>
                  choose…
                </option>
                {blank.options.map((opt, oi) => (
                  <option key={oi} value={oi}>
                    {opt}
                  </option>
                ))}
              </select>
            );
          })}
        </p>

        {solved && (
          <div className="rounded-xl border border-success bg-success-soft p-3 text-[14px]">
            <p className="font-bold">Exactly. 👏</p>
          </div>
        )}
        {wrongTry && !solved && (
          <div className="rounded-xl border border-accent bg-accent-soft p-3 text-[14px]">
            <p className="font-bold">Not quite — adjust a choice and try again.</p>
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
          disabled={!allChosen}
          className="w-full"
        >
          Check
        </Button>
      )}
    </div>
  );
}
