"use client";

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
      <div className="flex flex-1 flex-col justify-center gap-4">
        <p
          className="text-[15px] font-semibold text-brand-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Built for the classroom, not for prompt engineers.
        </p>
        <h1
          className="text-[28px] leading-tight font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {firstName ? `Welcome, ${firstName}.` : "Welcome."} Let&apos;s set
          this up around what you teach — takes a minute.
        </h1>
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Let&apos;s go
      </Button>
    </div>
  );
}
