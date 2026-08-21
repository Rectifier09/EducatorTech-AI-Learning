"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
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
          rows={4}
          placeholder="Write your prompt here…"
          className="rounded-xl border-[1.5px] border-line-2 bg-surface p-3 text-[14px] leading-relaxed focus-visible:border-brand focus-visible:outline-none"
        />
        {grade && (
          <div
            className={`rounded-xl border p-3 text-[14px] leading-relaxed ${
              grade.pass
                ? "border-success bg-success-soft"
                : "border-accent bg-accent-soft"
            }`}
          >
            <p className="font-bold">{grade.pass ? "Nice one. 👏" : "Almost there"}</p>
            <p className="mt-1">{grade.feedback}</p>
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
