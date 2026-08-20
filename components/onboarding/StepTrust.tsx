"use client";

import { MascotGuide } from "@/components/brand/MascotGuide";
import { Button } from "@/components/ui/Button";
import { trustMessage } from "@/lib/onboarding/trustCopy";
import type { Attitude } from "@/lib/data/types";

export function StepTrust({
  attitude,
  onNext,
}: {
  attitude: Attitude;
  onNext: () => void;
}) {
  const m = trustMessage(attitude);
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-1 flex-col justify-center gap-5">
        <MascotGuide mood={m.mascotMood} size={64} />
        <h1
          className="text-[26px] font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {m.headline}
        </h1>
        <p className="text-[15px] leading-relaxed text-ink">{m.body}</p>
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Let&apos;s go
      </Button>
    </div>
  );
}
