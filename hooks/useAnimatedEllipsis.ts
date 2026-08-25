"use client";

import { useEffect, useState } from "react";

/** Cycles "." → ".." → "..." → "." while active; empty when not. */
export function useAnimatedEllipsis(
  active: boolean,
  intervalMs = 400,
): string {
  const [dots, setDots] = useState(active ? "." : "");

  useEffect(() => {
    if (!active) {
      setDots("");
      return;
    }
    setDots(".");
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return dots;
}
