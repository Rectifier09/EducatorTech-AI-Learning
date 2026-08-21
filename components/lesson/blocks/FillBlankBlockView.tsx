"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnswerFeedback } from "@/components/lesson/AnswerFeedback";
import { GoldBurst } from "@/components/lesson/GoldBurst";
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
        <div className="relative">
          <p className="text-[16px] leading-[2.4]">
            {parts.map((part, i) => {
              const m = part.match(/^\{\{([^}]+)\}\}$/);
              const blank = m ? blanksById.get(m[1]) : undefined;
              if (!blank) return <span key={i}>{part}</span>;
              const chosen = choices[blank.id];

              let cls = "border-line-2 text-muted";
              if (solved) {
                cls = "border-[color:var(--green)] text-success-ink";
              } else if (wrongTry) {
                cls = "border-[color:var(--coral)] text-ink";
              } else if (chosen !== undefined) {
                cls = "border-brand text-brand-ink";
              }

              return (
                <select
                  key={i}
                  value={chosen ?? ""}
                  onChange={(e) => pick(blank.id, Number(e.target.value))}
                  disabled={solved}
                  className={`mx-1 min-w-[64px] border-b-2 bg-transparent px-1 pb-0.5 text-[15px] font-bold transition focus-visible:outline-none ${cls}`}
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
          <GoldBurst trigger={solved} />
        </div>

        <AnswerFeedback
          state={solved ? "correct" : wrongTry ? "notyet" : null}
        />
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
