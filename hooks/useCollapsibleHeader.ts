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

/**
 * Same collapsing-header behavior as `useCollapsibleHeader`, but driven by
 * the window's scroll position instead of a scrollable ancestor element.
 * Use this on pages where the document itself scrolls (no bounded,
 * `overflow`-scrolling container) — e.g. Learn home, whose shell has no
 * `overflow-hidden` ancestor to make an inner div actually scroll.
 */
export function useWindowCollapsibleHeader(
  opts: { enter?: number; exit?: number } = {},
): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const onScroll = () =>
      setCollapsed((prev) => nextCollapsed(window.scrollY, prev, opts));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [opts.enter, opts.exit]);
  return collapsed;
}
