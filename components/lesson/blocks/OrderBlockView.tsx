"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnswerFeedback } from "@/components/lesson/AnswerFeedback";
import { GoldBurst } from "@/components/lesson/GoldBurst";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { gradeOrder } from "@/lib/lesson/grade";
import type { OrderBlock } from "@/lib/content/types";

export function OrderBlockView({
  block,
  onNext,
  onResult,
}: {
  block: OrderBlock;
  onNext: () => void;
  onResult: (passed: boolean) => void;
}) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [wrongTry, setWrongTry] = useState(false);
  const firstScored = useRef(false);
  const reduced = usePrefersReducedMotion();
  const placedRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prevPlaced = useRef<string[]>([]);

  const itemsById = new Map(block.items.map((i) => [i.id, i.text]));
  const remaining = block.items.filter((i) => !placed.includes(i.id));

  function place(id: string) {
    if (solved) return;
    setWrongTry(false);
    setPlaced((p) => [...p, id]);
  }
  function unplace(id: string) {
    if (solved) return;
    setWrongTry(false);
    setPlaced((p) => p.filter((x) => x !== id));
  }

  function check() {
    if (placed.length !== block.items.length || solved) return;
    const ok = gradeOrder(block, placed);
    if (!firstScored.current) {
      firstScored.current = true;
      onResult(ok);
    }
    if (ok) setSolved(true);
    else setWrongTry(true);
  }

  // Spring settle: a piece lifts and settles into place the moment it's placed.
  useEffect(() => {
    if (!reduced) {
      const justAdded = placed.filter((id) => !prevPlaced.current.includes(id));
      for (const id of justAdded) {
        const el = placedRefs.current.get(id);
        el?.animate(
          [
            { transform: "translateY(-8px) scale(0.97)", opacity: 0.7 },
            { transform: "translateY(0) scale(1)", opacity: 1 },
          ],
          { duration: 360, easing: "cubic-bezier(.34,1.56,.64,1)" },
        );
      }
    }
    prevPlaced.current = placed;
  }, [placed, reduced]);

  // Tasteful delight: a brief spring across the settled sequence on a correct check.
  useEffect(() => {
    if (!solved || reduced) return;
    for (const id of placed) {
      const el = placedRefs.current.get(id);
      el?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.03)" },
          { transform: "scale(1)" },
        ],
        { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" },
      );
    }
    // Only the transition into `solved` should replay the spring.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, reduced]);

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        <h1
          className="text-[20px] font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {block.prompt}
        </h1>

        {/* Answer sequence */}
        <div className="relative flex min-h-[56px] flex-col gap-2 rounded-2xl border border-line bg-sunk p-2">
          {placed.length === 0 ? (
            <p className="p-2 text-[13px] text-muted">
              Tap the pieces below in the right order.
            </p>
          ) : (
            placed.map((id, i) => {
              let cls =
                "border-brand bg-brand-soft text-brand-ink shadow-[var(--glow-gold)]";
              if (solved) {
                cls =
                  "border-[color:var(--green)] bg-success-soft text-success-ink shadow-[var(--glow-green)]";
              }
              return (
                <button
                  key={id}
                  ref={(el) => {
                    if (el) placedRefs.current.set(id, el);
                    else placedRefs.current.delete(id);
                  }}
                  onClick={() => unplace(id)}
                  disabled={solved}
                  className={`flex min-h-[48px] items-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-left text-[14px] font-bold transition ${cls}`}
                >
                  <span className="text-muted">{i + 1}.</span>
                  <span>{itemsById.get(id)}</span>
                </button>
              );
            })
          )}
          <GoldBurst trigger={solved} />
        </div>

        {/* Remaining pieces */}
        {remaining.length > 0 && (
          <div className="flex flex-col gap-2">
            {remaining.map((i) => (
              <button
                key={i.id}
                onClick={() => place(i.id)}
                className="min-h-[48px] rounded-xl border-[1.5px] border-line bg-surface px-3 py-2.5 text-left text-[14px] font-bold transition hover:border-brand"
              >
                {i.text}
              </button>
            ))}
          </div>
        )}

        <AnswerFeedback
          state={solved ? "correct" : wrongTry ? "notyet" : null}
        />
        {wrongTry && !solved && (
          <p className="text-[13px] text-muted">
            Tap a piece to move it back, then try again.
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
          disabled={placed.length !== block.items.length}
          className="w-full"
        >
          Check
        </Button>
      )}
    </div>
  );
}
