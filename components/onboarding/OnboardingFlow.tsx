"use client";

import { useState } from "react";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { ONBOARDING_STEPS, nextStep, type StepId } from "@/lib/onboarding/steps";
import { StepWelcome } from "./StepWelcome";
import { StepRole } from "./StepRole";
import { StepSubject } from "./StepSubject";
import { StepGrade } from "./StepGrade";
import { StepSurvey } from "./StepSurvey";
import { StepTrust } from "./StepTrust";
import { StepTaste } from "./StepTaste";
import type { Attitude } from "@/lib/data/types";

export function OnboardingFlow({ firstName }: { firstName: string | null }) {
  const [step, setStep] = useState<StepId>("welcome");
  const [subject, setSubject] = useState<string | null>(null);
  const [gradeBand, setGradeBand] = useState<string | null>(null);
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
        {step === "subject" && (
          <StepSubject
            onDone={(v) => {
              setSubject(v);
              advance();
            }}
          />
        )}
        {step === "grade" && (
          <StepGrade
            onDone={(v) => {
              setGradeBand(v);
              advance();
            }}
          />
        )}
        {step === "survey" && (
          <StepSurvey
            onDone={(a) => {
              setAttitude(a);
              advance();
            }}
          />
        )}
        {step === "trust" && <StepTrust attitude={attitude} onNext={advance} />}
        {step === "taste" && (
          <StepTaste subject={subject} gradeBand={gradeBand} />
        )}
      </div>
    </main>
  );
}
