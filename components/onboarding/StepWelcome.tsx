"use client";

import { MascotGuide } from "@/components/brand/MascotGuide";
import { Button } from "@/components/ui/Button";

export function StepWelcome({
  firstName,
  onNext,
}: {
  firstName: string | null;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-1 flex-col justify-center gap-6">
        <MascotGuide
          mood="welcome"
          size={64}
          caption={`Welcome${firstName ? `, ${firstName}` : ""}. I'm Ravi — a teacher, like you.`}
        />
        <h1
          className="text-[28px] leading-tight font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Let&apos;s set this up around what you teach — takes a minute.
        </h1>
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Let&apos;s go
      </Button>
    </div>
  );
}
