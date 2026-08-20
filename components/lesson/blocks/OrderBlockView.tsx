"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
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
        <div className="flex min-h-[56px] flex-col gap-2 rounded-xl border border-line bg-sunk p-2">
          {placed.length === 0 ? (
            <p className="p-2 text-[13px] text-muted">
              Tap the pieces below in the right order.
            </p>
          ) : (
            placed.map((id, i) => (
              <button
                key={id}
                onClick={() => unplace(id)}
                disabled={solved}
                className={`flex items-center gap-2 rounded-lg border-[1.5px] px-3 py-2.5 text-left text-[14px] font-bold ${
                  solved
                    ? "border-success bg-success-soft text-success-ink"
                    : "border-brand bg-surface"
                }`}
              >
                <span className="text-muted">{i + 1}.</span>
                <span>{itemsById.get(id)}</span>
              </button>
            ))
          )}
        </div>

        {/* Remaining pieces */}
        {remaining.length > 0 && (
          <div className="flex flex-col gap-2">
            {remaining.map((i) => (
              <button
                key={i.id}
                onClick={() => place(i.id)}
                className="rounded-lg border-[1.5px] border-line-2 bg-surface px-3 py-2.5 text-left text-[14px] font-bold hover:border-brand"
              >
                {i.text}
              </button>
            ))}
          </div>
        )}

        {solved && (
          <div className="rounded-xl border border-success bg-success-soft p-3 text-[14px]">
            <p className="font-bold">Exactly. 👏</p>
          </div>
        )}
        {wrongTry && !solved && (
          <div className="rounded-xl border border-accent bg-accent-soft p-3 text-[14px]">
            <p className="font-bold">
              Not quite — tap a piece to move it back, then try again.
            </p>
          </div>
        )}
      </div>

      {solved ? (
        <Button variant="primary" onClick={onNext} className="w-full">
          Continue
        </Button>
      ) : (
        <Button
          variant="indigo"
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
