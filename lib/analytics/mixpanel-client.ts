"use client";

import mixpanel from "mixpanel-browser";

let initialized = false;

function ensureInit(): boolean {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return false;
  if (!initialized) {
    mixpanel.init(token, {
      autocapture: true,
      track_pageview: true,
      persistence: "localStorage",
    });
    initialized = true;
  }
  return true;
}

/** Initialize Mixpanel (idempotent). Safe to call with no signed-in user. */
export function init(): void {
  ensureInit();
}

/** Associate all subsequent client events with the signed-in user's id. */
export function identify(userId: string): void {
  if (!ensureInit()) return;
  mixpanel.identify(userId);
}

/** Fire-and-forget client-side event. No-ops if Mixpanel isn't configured. */
export function track(name: string, props: Record<string, unknown> = {}): void {
  if (!ensureInit()) return;
  mixpanel.track(name, props);
}
