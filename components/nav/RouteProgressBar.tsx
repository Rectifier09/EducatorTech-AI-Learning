"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { start, done, isLoading, subscribe } from "@/lib/nav/routeProgress";

const TRICKLE_CEILING = 85;
const TRICKLE_INTERVAL_MS = 200;
const HIDE_DELAY_MS = 200;

let historyPatched = false;

/**
 * The App Router drives client-side navigation through history.pushState /
 * replaceState — patching them is the only reliable, dependency-free signal
 * that a navigation has begun (Next.js exposes no route-change event).
 */
function patchHistoryOnce(): void {
  if (historyPatched) return;
  historyPatched = true;
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.pushState = (...args: Parameters<typeof window.history.pushState>) => {
    start();
    return originalPushState(...args);
  };
  window.history.replaceState = (...args: Parameters<typeof window.history.replaceState>) => {
    start();
    return originalReplaceState(...args);
  };
  window.addEventListener("popstate", start);
}

export function RouteProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const isFirstRender = useRef(true);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    patchHistoryOnce();
    return subscribe(() => {
      if (isLoading()) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (trickleRef.current) clearInterval(trickleRef.current);
        setVisible(true);
        setWidth(15);
        trickleRef.current = setInterval(() => {
          setWidth((w) => w + (TRICKLE_CEILING - w) * 0.15);
        }, TRICKLE_INTERVAL_MS);
      } else {
        if (trickleRef.current) {
          clearInterval(trickleRef.current);
          trickleRef.current = null;
        }
        setWidth(100);
        hideTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          setWidth(0);
        }, HIDE_DELAY_MS);
      }
    });
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    done();
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      data-testid="route-progress-bar"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] transition-opacity duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        data-testid="route-progress-fill"
        className="h-full bg-gradient-to-r from-accent to-brand shadow-[var(--glow-gold)] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
