"use client";

import { useEffect, useState } from "react";
import { getOrCreateReferralCode, logReferralShare } from "@/app/actions/referral";
import { buildWhatsappShareHref } from "@/lib/referral/shareMessage";

/**
 * A minimal round icon-button entry point to the referral share flow, for
 * placement outside the You tab (e.g. the Learn home header). Prefetches
 * the code in the background so the tap itself opens WhatsApp immediately.
 */
export function ShareIconButton() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getOrCreateReferralCode();
        if (!cancelled) setCode(c);
      } catch (e) {
        console.error("Failed to load referral code:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!code) return null;

  function handleClick() {
    const href = buildWhatsappShareHref(window.location.origin, code!);
    void logReferralShare();
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Share app"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-accent to-brand text-[color:var(--gold-soft)] shadow-[var(--glow-gold)] transition hover:brightness-105"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
        <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
      </svg>
    </button>
  );
}
