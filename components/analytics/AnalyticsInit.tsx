"use client";

import { useEffect } from "react";
import { init, identify } from "@/lib/analytics/mixpanel-client";

/**
 * Mounts once in the root layout. Initializes Mixpanel (via the first
 * identify()/track() call it triggers) and identifies the signed-in user so
 * client autocapture + pageviews join the same profile as server-mirrored
 * events. Renders nothing.
 */
export function AnalyticsInit({ userId }: { userId: string | null }) {
  useEffect(() => {
    init();
    if (userId) identify(userId);
  }, [userId]);

  return null;
}
