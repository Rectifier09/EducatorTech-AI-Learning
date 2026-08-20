"use client";

import { useState } from "react";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { Button } from "@/components/ui/Button";
import { ONBOARDING_STEPS, nextStep, type StepId } from "@/lib/onboarding/steps";

/**
 * Onboarding step container. Tasks 8–11 replace the placeholder body with the
 * real step components (welcome / role / subject / grade / survey / trust / taste).
 */
export function OnboardingFlow({ firstName }: { firstName: string | null }) {
  const [step, setStep] = useState<StepId>("welcome");
  const index = ONBOARDING_STEPS.indexOf(step);

  function advance() {
    const n = nextStep(step);
    if (n) setStep(n);
  }

  return (
    <main className="flex min-h-full flex-col gap-6 p-6">
      <ProgressDots total={ONBOARDING_STEPS.length} current={index} />

      <div className="flex flex-1 flex-col justify-between gap-6">
        <div className="flex flex-1 flex-col items-start justify-center gap-3">
          <p className="text-sm text-muted">
            Step {index + 1} of {ONBOARDING_STEPS.length}
            {firstName ? ` · ${firstName}` : ""}
          </p>
          <h1
            className="text-3xl font-semibold capitalize"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {step}
          </h1>
        </div>

        <Button variant="primary" onClick={advance} className="w-full">
          Continue
        </Button>
      </div>
    </main>
  );
}
