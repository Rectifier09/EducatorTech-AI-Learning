"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnswerFeedback } from "@/components/lesson/AnswerFeedback";
import { GoldBurst } from "@/components/lesson/GoldBurst";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
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
  const reduced = usePrefersReducedMotion();
  const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  // Tasteful delight: a brief spring settle on the option(s) that were
  // correct, the moment the answer is confirmed.
  useEffect(() => {
    if (!solved || reduced) return;
    for (const id of selected) {
      const el = optionRefs.current.get(id);
      el?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.03)" },
          { transform: "scale(1)" },
        ],
        { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" },
      );
    }
  }, [solved, reduced, selected]);

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
        <div className="flex flex-col gap-3">
          {block.options.map((o) => {
            const sel = selected.includes(o.id);
            const isCorrectOption = block.correctIds.includes(o.id);
            const showCorrect = solved && sel;

            let cls = "border-line bg-surface";
            if (showCorrect) {
              cls =
                "border-[color:var(--green)] bg-success-soft text-success-ink shadow-[var(--glow-green)]";
            } else if (sel) {
              cls =
                "border-brand bg-brand-soft text-brand-ink shadow-[var(--glow-gold)]";
            }

            return (
              <div key={o.id} className="relative">
                <button
                  ref={(el) => {
                    if (el) optionRefs.current.set(o.id, el);
                    else optionRefs.current.delete(o.id);
                  }}
                  onClick={() => toggle(o.id)}
                  disabled={solved}
                  aria-pressed={sel}
                  className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] px-5 py-4 text-left text-[15px] font-bold transition ${cls}`}
                >
                  <span>{o.text}</span>
                  {showCorrect && (
                    <span className="shrink-0 text-[13px]">✓</span>
                  )}
                </button>
                {/* Mounted on every correct option; fires its burst only
                    when that option is the one just confirmed correct. The
                    origin is anchored near the trailing ✓ rather than the
                    dead-centre of a full-width option, so the burst reads as
                    springing from the success mark. */}
                {isCorrectOption && (
                  <GoldBurst
                    trigger={solved && sel}
                    originX="88%"
                    originY="50%"
                    delayMs={200}
                  />
                )}
              </div>
            );
          })}
        </div>

        <AnswerFeedback state={solved ? "correct" : wrongTry ? "notyet" : null} />

        {solved && (
          <p className="text-[14px] leading-relaxed text-muted">
            {block.explanation}
          </p>
        )}
        {wrongTry && !solved && multi && (
          <p className="text-[13px] text-muted">
            Tip: it&apos;s more than one, and not all of them.
          </p>
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
