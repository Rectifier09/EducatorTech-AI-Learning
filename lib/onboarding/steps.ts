export type StepId =
  | "welcome"
  | "role"
  | "subject"
  | "grade"
  | "survey"
  | "trust"
  | "taste";

export const ONBOARDING_STEPS: readonly StepId[] = [
  "welcome",
  "role",
  "subject",
  "grade",
  "survey",
  "trust",
  "taste",
];

export function nextStep(current: StepId): StepId | null {
  const i = ONBOARDING_STEPS.indexOf(current);
  return i >= 0 && i < ONBOARDING_STEPS.length - 1
    ? ONBOARDING_STEPS[i + 1]
    : null;
}

export function prevStep(current: StepId): StepId | null {
  const i = ONBOARDING_STEPS.indexOf(current);
  return i > 0 ? ONBOARDING_STEPS[i - 1] : null;
}
