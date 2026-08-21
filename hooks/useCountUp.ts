"use client";

import { useEffect, useRef, useState } from "react";
import { countUpValue } from "@/lib/ui/motion";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export function useCountUp(
  target: number,
  opts: { durationMs?: number; enabled?: boolean } = {},
): number {
  const { durationMs = 1400, enabled = true } = opts;
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(enabled && !reduced ? 0 : target);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!enabled || reduced) {
      setValue(target);
      return;
    }
    const from = valueRef.current;
    if (from === target) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      setValue(countUpValue(from, target, p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Re-runs (and re-animates from the current value) whenever `target`
    // changes, so later updates aren't dropped by a one-shot guard.
  }, [target, durationMs, enabled, reduced]);

  return value;
}
