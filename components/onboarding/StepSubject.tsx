"use client";

import { ChoiceStep } from "./ChoiceStep";
import { SUBJECT_OPTIONS } from "@/lib/onboarding/options";
import { saveOnboardingField } from "@/app/actions/onboarding";

export function StepSubject({
  onDone,
}: {
  onDone: (subject: string) => void;
}) {
  return (
    <ChoiceStep
      caption="And what do you mostly teach?"
      prompt="Your subject"
      options={SUBJECT_OPTIONS}
      onSelect={async (subject) => {
        await saveOnboardingField({ subject });
        onDone(subject);
      }}
    />
  );
}
