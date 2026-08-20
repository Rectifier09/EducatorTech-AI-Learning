"use client";

import { ChoiceStep } from "./ChoiceStep";
import { GRADE_OPTIONS } from "@/lib/onboarding/options";
import { saveOnboardingField } from "@/app/actions/onboarding";

export function StepGrade({
  onDone,
}: {
  onDone: (gradeBand: string) => void;
}) {
  return (
    <ChoiceStep
      caption="Which grades, mostly?"
      prompt="Grade level"
      options={GRADE_OPTIONS}
      onSelect={async (gradeBand) => {
        await saveOnboardingField({ gradeBand });
        onDone(gradeBand);
      }}
    />
  );
}
