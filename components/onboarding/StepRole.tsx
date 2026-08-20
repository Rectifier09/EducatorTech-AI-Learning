"use client";

import { ChoiceStep } from "./ChoiceStep";
import { ROLE_OPTIONS } from "@/lib/onboarding/options";
import { saveOnboardingField } from "@/app/actions/onboarding";

export function StepRole({ onNext }: { onNext: () => void }) {
  return (
    <ChoiceStep
      caption="First up —"
      prompt="What best describes you?"
      options={ROLE_OPTIONS}
      onSelect={async (role) => {
        await saveOnboardingField({ role });
        onNext();
      }}
    />
  );
}
