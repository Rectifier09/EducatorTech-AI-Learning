"use client";

import { useState } from "react";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { Button } from "@/components/ui/Button";
import { ONBOARDING_STEPS, nextStep, type StepId } from "@/lib/onboarding/steps";
import { StepWelcome } from "./StepWelcome";
import { StepRole } from "./StepRole";
import { StepSubject } from "./StepSubject";
import { StepGrade } from "./StepGrade";
import { StepSurvey } from "./StepSurvey";
import { StepTrust } from "./StepTrust";
import type { Attitude } from "@/lib/data/types";

export function OnboardingFlow({ firstName }: { firstName: string | null }) {
  const [step, setStep] = useState<StepId>("welcome");
  const [attitude, setAttitude] = useState<Attitude>("curious");
  const index = ONBOARDING_STEPS.indexOf(step);

  function advance() {
    const n = nextStep(step);
    if (n) setStep(n);
  }

  return (
    <main className="flex min-h-full flex-col gap-6 p-6">
      <ProgressDots total={ONBOARDING_STEPS.length} current={index} />

      <div className="flex flex-1 flex-col">
        {step === "welcome" && (
          <StepWelcome firstName={firstName} onNext={advance} />
        )}
        {step === "role" && <StepRole onNext={advance} />}
        {step === "subject" && <StepSubject onNext={advance} />}
        {step === "grade" && <StepGrade onNext={advance} />}
        {step === "survey" && (
          <StepSurvey
            onDone={(a) => {
              setAttitude(a);
              advance();
            }}
          />
        )}
        {step === "trust" && (
          <StepTrust attitude={attitude} onNext={advance} />
        )}
        {step === "taste" && <PlaceholderStep step={step} onNext={advance} />}
      </div>
    </main>
  );
}

// Temporary — replaced by real components in Tasks 9 (survey), 10 (trust), 11 (taste).
function PlaceholderStep({
  step,
  onNext,
}: {
  step: StepId;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-1 flex-col items-start justify-center gap-3">
        <p className="text-sm text-muted">coming next</p>
        <h1
          className="text-3xl font-semibold capitalize"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {step}
        </h1>
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
      </Button>
    </div>
  );
}
