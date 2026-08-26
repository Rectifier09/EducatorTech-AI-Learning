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
      valueProp="From lesson plans to quizzes — one tool for your whole week."
      prompt="Your subject"
      options={SUBJECT_OPTIONS}
      onSelect={async (subject) => {
        await saveOnboardingField({ subject });
        onDone(subject);
      }}
    />
  );
}
