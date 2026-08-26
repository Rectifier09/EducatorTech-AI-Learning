"use client";

import { useEffect, useState } from "react";
import { getOrCreateReferralCode, logReferralShare } from "@/app/actions/referral";

export function ShareApp() {
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

  const link = `${window.location.origin}/r/${code}`;
  const message = `I've been using SahajAiVidya to make worksheets and quizzes in minutes instead of hours — thought you'd like it too: ${link}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-4 shadow-[var(--elev-1)]">
      <p className="text-[13px] font-bold text-ink">
        Know a teacher who&apos;d love this?
      </p>
      <p className="truncate text-[12px] text-muted">{link}</p>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          void logReferralShare();
        }}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-gradient-to-b from-accent to-brand px-6 py-3 text-[15px] font-extrabold tracking-tight text-[color:var(--gold-soft)] shadow-[var(--glow-gold)] transition hover:brightness-105"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
