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
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || reduced) {
      setValue(target);
      return;
    }
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / durationMs, 1);
      setValue(countUpValue(0, target, p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, enabled, reduced]);

  return value;
}
