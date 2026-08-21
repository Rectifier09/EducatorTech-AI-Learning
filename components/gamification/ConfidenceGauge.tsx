"use client";

import { useEffect, useState } from "react";
import { clampScore, gaugeDash } from "@/lib/ui/gauge";
import { useCountUp } from "@/hooks/useCountUp";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

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

  // usePrefersReducedMotion starts `false` on both server and first client
  // render, so the initial markup always matches (no hydration mismatch);
  // it settles to the real preference in an effect after mount.
  const prefersReduced = usePrefersReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  const shown = useCountUp(target, { enabled: shouldAnimate });
  const [offset, setOffset] = useState(shouldAnimate ? dash.valueLen : 0);

  useEffect(() => {
    if (!shouldAnimate) {
      setOffset(0);
      return;
    }
    setOffset(dash.valueLen);
    const id = requestAnimationFrame(() => setOffset(0));
    return () => cancelAnimationFrame(id);
  }, [shouldAnimate, dash.valueLen]);

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
        aria-label={`${label}: ${target} out of 100`}
      >
        <svg
          viewBox="0 0 300 300"
          className="h-full w-full"
          aria-hidden="true"
        >
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
              filter: "drop-shadow(var(--glow-gold))",
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
