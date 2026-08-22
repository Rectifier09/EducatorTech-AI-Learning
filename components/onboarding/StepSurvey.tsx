"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { savePreSurvey } from "@/app/actions/onboarding";
import type { Attitude } from "@/lib/data/types";

const ATTITUDES: { value: Attitude; label: string }[] = [
  { value: "excited", label: "Excited" },
  { value: "curious", label: "Curious" },
  { value: "cautious", label: "Cautious" },
  { value: "skeptical", label: "Skeptical" },
];

export function StepSurvey({
  onDone,
}: {
  onDone: (attitude: Attitude) => void;
}) {
  const [usingScore, setUsing] = useState<number | null>(null);
  const [trustScore, setTrust] = useState<number | null>(null);
  const [attitude, setAttitude] = useState<Attitude | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = usingScore !== null && trustScore !== null && attitude !== null;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    await savePreSurvey({ usingScore, trustScore, attitude });
    onDone(attitude);
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-col gap-6">
        <h1
          className="text-[24px] leading-tight font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          How do you feel about AI in your teaching today?
        </h1>

        <Scale
          label="Using AI tools"
          low="Never tried"
          high="Very confident"
          value={usingScore}
          onChange={setUsing}
        />
        <Scale
          label="Knowing when to trust AI"
          low="No idea"
          high="Very sure"
          value={trustScore}
          onChange={setTrust}
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">And honestly, how do you feel?</p>
          <div className="grid grid-cols-2 gap-2">
            {ATTITUDES.map((a) => (
              <button
                key={a.value}
                onClick={() => setAttitude(a.value)}
                className={`rounded-xl border-[1.5px] px-3 py-2.5 text-sm font-bold transition ${
                  attitude === a.value
                    ? "border-brand bg-brand-soft text-brand-ink shadow-[var(--glow-gold)]"
                    : "border-line-2 bg-surface text-ink hover:border-brand"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        onClick={submit}
        disabled={!ready || busy}
        className="w-full"
      >
        {busy ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}

function Scale({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`flex-1 rounded-lg border-[1.5px] py-2.5 text-sm font-bold transition ${
              value === n
                ? "border-brand bg-brand-soft text-brand-ink shadow-[var(--glow-gold)]"
                : "border-line-2 bg-surface text-ink hover:border-brand"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
