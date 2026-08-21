"use client";

import { useEffect, useState, type RefObject } from "react";
import { nextCollapsed } from "@/lib/ui/collapse";

export function useCollapsibleHeader(
  ref: RefObject<HTMLElement | null>,
  opts: { enter?: number; exit?: number } = {},
): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () =>
      setCollapsed((prev) => nextCollapsed(el.scrollTop, prev, opts));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ref, opts.enter, opts.exit]);
  return collapsed;
}
