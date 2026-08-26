"use client";

import { useState } from "react";
import type { z } from "zod";
import type { questionSetSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, ListRow } from "./primitives";

type QuestionSetData = z.infer<typeof questionSetSchema>;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionSet({ data }: { data: QuestionSetData }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <ArtifactHeading>{data.title}</ArtifactHeading>
        {data.instructions && (
          <p className="mt-1 text-[13px] italic text-faint">{data.instructions}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {data.questions.map((q) => (
          <ListRow
            key={q.number}
            icon={
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sunk text-[12px] font-bold text-ink">
                {q.number}
              </span>
            }
          >
            <p>{q.prompt}</p>
            {q.options && q.options.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1 text-[13px] text-muted">
                {q.options.map((opt, i) => (
                  <li key={i}>
                    {LETTERS[i] ?? i + 1}) {opt}
                  </li>
                ))}
              </ul>
            )}
          </ListRow>
        ))}
      </div>
      <div>
        <button
          onClick={() => setShowAnswers((s) => !s)}
          className="text-[13px] font-extrabold text-brand-ink underline underline-offset-2"
        >
          {showAnswers ? "Hide answer key" : "Show answer key"}
        </button>
        {showAnswers && (
          <ul className="mt-2 flex flex-col gap-1 rounded-xl border border-line-2 bg-sunk p-3 text-[13px] text-muted">
            {data.questions.map((q) => (
              <li key={q.number}>
                {q.number}. {q.answer}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
