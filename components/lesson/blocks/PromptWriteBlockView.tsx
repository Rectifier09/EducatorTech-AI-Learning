"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnswerFeedback } from "@/components/lesson/AnswerFeedback";
import { GoldBurst } from "@/components/lesson/GoldBurst";
import type { PromptWriteBlock } from "@/lib/content/types";
import type { PromptGrade } from "@/lib/ai/gradePrompt";

export function PromptWriteBlockView({
  block,
  onNext,
  onResult,
}: {
  block: PromptWriteBlock;
  onNext: () => void;
  onResult: (passed: boolean) => void;
}) {
  const [submission, setSubmission] = useState("");
  const [grade, setGrade] = useState<PromptGrade | null>(null);
  const [busy, setBusy] = useState(false);
  const firstScored = useRef(false);

  async function submit() {
    if (!submission.trim() || busy) return;
    setBusy(true);
    let g: PromptGrade;
    try {
      const res = await fetch("/api/ai/grade-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: block.brief,
          rubric: block.rubric,
          submission,
        }),
      });
      g = res.ok
        ? await res.json()
        : { pass: true, feedback: "Good effort — let's keep going.", met: [], missing: [] };
    } catch {
      g = { pass: true, feedback: "Good effort — let's keep going.", met: [], missing: [] };
    }
    setBusy(false);
    setGrade(g);
    if (!firstScored.current) {
      firstScored.current = true;
      onResult(g.pass);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        <h1
          className="text-[18px] font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {block.brief}
        </h1>
        <textarea
          value={submission}
          onChange={(e) => {
            setSubmission(e.target.value);
            setGrade(null);
          }}
          rows={5}
          placeholder="Write your prompt here…"
          className="rounded-2xl border-[1.5px] border-line bg-surface p-4 text-[15px] leading-[1.7] text-ink transition placeholder:text-faint focus-visible:border-brand focus-visible:shadow-[var(--glow-gold)] focus-visible:outline-none"
        />

        {grade && (
          <div className="relative flex flex-col gap-2">
            <AnswerFeedback
              state={grade.pass ? "correct" : "notyet"}
              correctLine="Nice one."
            />
            <div
              className={`rounded-2xl border-[1.5px] p-4 text-[14px] leading-relaxed ${
                grade.pass
                  ? "border-[color:var(--green)] bg-success-soft text-success-ink"
                  : "border-[color:var(--coral)] bg-surface"
              }`}
            >
              {grade.feedback}
            </div>
            <GoldBurst trigger={grade.pass} />
          </div>
        )}
      </div>
      {grade?.pass ? (
        <Button variant="primary" onClick={onNext} className="w-full">
          Continue
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={submit}
          disabled={busy || !submission.trim()}
          className="w-full"
        >
          {busy ? "Checking…" : grade ? "Try again" : "Check my prompt"}
        </Button>
      )}
    </div>
  );
}
