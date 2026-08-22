"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { GoldBurst } from "@/components/lesson/GoldBurst";

interface RewardMomentProps {
  /** Small uppercase gold eyebrow above the title. */
  kicker: string;
  /** Headline, set in Fraunces. */
  title: string;
  /** Body copy under the headline/gauge. */
  children?: ReactNode;
  /** Optional slot for a ConfidenceGauge, a number, or any reveal visual. */
  gauge?: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * Shared full-screen "reward moment" — the family look for the capstone
 * reveal, lesson-complete, level-up, and badge-unlock screens (spec §10).
 * Dark ground, a soft gold bloom behind the headline, a whisper of gold
 * particles fired once on mount, one gold primary action.
 */
export function RewardMoment({
  kicker,
  title,
  children,
  gauge,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: RewardMomentProps) {
  const [burst, setBurst] = useState(false);

  // Flips true after mount so GoldBurst sees a false -> true edge and fires
  // once. GoldBurst itself no-ops under prefers-reduced-motion.
  useEffect(() => {
    setBurst(true);
  }, []);

  return (
    <section
      role="status"
      aria-live="polite"
      className="relative flex min-h-full flex-col items-center justify-center gap-6 overflow-hidden p-6 text-center"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex justify-center"
      >
        <div
          className="mt-[-18%] h-[520px] w-[520px] rounded-full opacity-80 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--gold-soft), transparent 70%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-2">
        <GoldBurst trigger={burst} />
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-ink">
          {kicker}
        </span>
        <h1
          className="text-3xl font-semibold text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
      </div>

      {gauge && <div className="relative">{gauge}</div>}

      {children && (
        <div className="relative max-w-sm text-[15px] leading-relaxed text-muted">
          {children}
        </div>
      )}

      <div className="relative flex w-full max-w-sm flex-col gap-2 pt-2">
        <Button variant="primary" onClick={onPrimary} className="w-full">
          {primaryLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button variant="ghost" onClick={onSecondary} className="w-full">
            {secondaryLabel}
          </Button>
        )}
      </div>
    </section>
  );
}
