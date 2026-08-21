"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfidenceMeter } from "@/components/gamification/ConfidenceMeter";
import { savePostSurvey } from "@/app/actions/survey";
import { commitToUse } from "@/app/actions/commitment";
import type { Attitude } from "@/lib/data/types";

const ATTITUDES: { value: Attitude; label: string }[] = [
  { value: "excited", label: "Excited" },
  { value: "curious", label: "Curious" },
  { value: "cautious", label: "Cautious" },
  { value: "skeptical", label: "Skeptical" },
];

const pct = (u: number, t: number) => Math.round((((u + t) / 2) / 5) * 100);

export function PostSurvey({ onNext }: { onNext: () => void }) {
  const [usingScore, setUsing] = useState<number | null>(null);
  const [trustScore, setTrust] = useState<number | null>(null);
  const [attitude, setAttitude] = useState<Attitude | null>(null);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<{
    before: number;
    after: number;
    shift: "up" | "same" | "down";
  } | null>(null);
  const [committed, setCommitted] = useState(false);

  async function commit(daysAhead: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setCommitted(true);
    await commitToUse(d.toISOString().slice(0, 10));
  }

  const ready = usingScore !== null && trustScore !== null && attitude !== null;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    const res = await savePostSurvey({ usingScore, trustScore, attitude });
    const after = pct(usingScore, trustScore);
    const before = res.pre
      ? pct(res.pre.usingScore, res.pre.trustScore)
      : after;
    setReveal({ before, after, shift: res.delta?.attitudeShift ?? "same" });
    setBusy(false);
  }

  if (reveal) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-6 text-center">
        <span className="text-4xl" aria-hidden="true">
          🎓
        </span>
        <h1
          className="text-[24px] font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Look how far you&apos;ve come.
        </h1>
        <div className="flex flex-col gap-4 text-left">
          <ConfidenceMeter value={reveal.before} label="Day one" />
          <ConfidenceMeter value={reveal.after} label="Now" />
        </div>
        {reveal.shift === "up" && (
          <p className="text-[15px] font-bold text-success-ink">
            You came in more unsure — look where you are now. That&apos;s real. 🎉
          </p>
        )}
        <p className="text-sm text-muted">
          You&apos;re now ahead of most teachers in the country. And this is just
          the start.
        </p>

        {committed ? (
          <p className="text-[14px] font-bold text-success-ink">
            Great — we&apos;ll check in on how it went. ✅
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold">
              When will you use what you made in class?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => commit(1)}
                className="flex-1 rounded-lg border-[1.5px] border-line-2 bg-surface py-2 text-[14px] font-bold hover:border-brand"
              >
                Tomorrow
              </button>
              <button
                onClick={() => commit(3)}
                className="flex-1 rounded-lg border-[1.5px] border-line-2 bg-surface py-2 text-[14px] font-bold hover:border-brand"
              >
                This week
              </button>
            </div>
          </div>
        )}

        <Button variant="primary" onClick={onNext} className="w-full">
          See what&apos;s next
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-col gap-6">
        <h1
          className="text-[20px] font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          One last check-in — same questions as day one. Be honest.
        </h1>
        <Scale label="Using AI tools" value={usingScore} onChange={setUsing} />
        <Scale
          label="Knowing when to trust AI"
          value={trustScore}
          onChange={setTrust}
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">And how do you feel now?</p>
          <div className="grid grid-cols-2 gap-2">
            {ATTITUDES.map((a) => (
              <button
                key={a.value}
                onClick={() => setAttitude(a.value)}
                className={`rounded-xl border-[1.5px] px-3 py-2.5 text-sm font-bold transition ${
                  attitude === a.value
                    ? "border-brand bg-brand-soft text-brand-ink"
                    : "border-line-2 bg-surface hover:border-brand"
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
        {busy ? "Saving…" : "See my progress"}
      </Button>
    </div>
  );
}

function Scale({
  label,
  value,
  onChange,
}: {
  label: string;
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
                ? "border-brand bg-brand-soft text-brand-ink"
                : "border-line-2 bg-surface hover:border-brand"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
