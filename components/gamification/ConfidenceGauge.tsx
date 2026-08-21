"use client";

import { useEffect, useRef, useState } from "react";
import { clampScore, gaugeDash } from "@/lib/ui/gauge";

interface Props {
  value: number;
  label?: string;
  deltaThisWeek?: number;
  variant?: "full" | "chip";
  animate?: boolean;
}

const SIZES = {
  full: { box: 240, stroke: 18, num: "text-[3.4rem]" },
  chip: { box: 40, stroke: 26, num: "text-[0.82rem]" },
} as const;

export function ConfidenceGauge({
  value,
  label = "AI confidence",
  deltaThisWeek,
  variant = "full",
  animate = true,
}: Props) {
  const target = clampScore(value);
  const dash = gaugeDash(target);
  const s = SIZES[variant];

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const shouldAnimate = animate && !prefersReduced;

  const [shown, setShown] = useState(shouldAnimate ? 0 : target);
  const [offset, setOffset] = useState(shouldAnimate ? dash.valueLen : 0);
  const started = useRef(false);

  useEffect(() => {
    if (!shouldAnimate || started.current) return;
    started.current = true;
    const id = requestAnimationFrame(() => setOffset(0));
    const t0 = performance.now();
    const dur = 1400;
    function tick(now: number) {
      const p = Math.min((now - t0) / dur, 1);
      setShown(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [shouldAnimate, target, dash.valueLen]);

  const showChip = variant === "chip";

  return (
    <div
      className={
        showChip ? "flex items-center gap-2" : "flex flex-col items-center gap-1"
      }
    >
      <div
        className="relative"
        style={{ width: s.box, height: s.box }}
        role="img"
        aria-label={`AI confidence: ${target} out of 100`}
      >
        <svg viewBox="0 0 300 300" className="h-full w-full">
          <defs>
            <linearGradient id="cg-arc" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--gold)" />
              <stop offset="55%" stopColor="var(--gold-bright)" />
              <stop offset="100%" stopColor="var(--green)" />
            </linearGradient>
          </defs>
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="var(--surface-2)"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={dash.track}
            transform="rotate(135 150 150)"
          />
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="url(#cg-arc)"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={dash.value}
            strokeDashoffset={offset}
            transform="rotate(135 150 150)"
            style={{
              filter: "drop-shadow(0 0 10px rgba(234,181,77,.42))",
              transition: shouldAnimate
                ? "stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)"
                : "none",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-[family-name:var(--font-display)] font-semibold tabular-nums leading-none ${s.num}`}
          >
            {shown}
          </span>
        </div>
      </div>

      {!showChip && (
        <>
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted">
            {label}
          </span>
          {typeof deltaThisWeek === "number" && deltaThisWeek > 0 && (
            <span className="text-[0.82rem] font-bold text-success-ink">
              +{deltaThisWeek} this week
            </span>
          )}
        </>
      )}

      {showChip && (
        <span className="text-[0.72rem] font-extrabold text-ink">
          {label}
          {typeof deltaThisWeek === "number" && deltaThisWeek > 0 && (
            <span className="ml-1 font-semibold text-faint">
              · +{deltaThisWeek}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
