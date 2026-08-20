// Canned "instant taste" example shown at the end of onboarding.
// TODO(Phase 3): replace sampleOutput with a live model call via lib/ai,
// keeping this as the offline fallback.

const SAMPLES: Record<string, string> = {
  Science:
    "Q: Which gas do plants take in from the air to make their food? (a) Oxygen (b) Carbon dioxide (c) Nitrogen — Answer: (b) Carbon dioxide.",
  Math: "Q: A shirt costs ₹450 after a 10% discount. What was its original price? — Answer: ₹500.",
  English:
    'Q: Identify the verb in this sentence: "The children played in the garden." — Answer: played.',
  "Social Studies":
    "Q: Name two major rivers of India and one state each flows through. — Answer: e.g. Ganga (Uttar Pradesh), Godavari (Maharashtra).",
  Languages:
    "Q: Frame one polite request using the word 'please', then underline the verb. — Answer varies.",
  "Computer / IT":
    "Q: What does a web browser do, in one sentence? — Answer: It fetches and displays web pages from the internet.",
};

const GENERIC =
  "Q: In one sentence, explain today's topic in your own words. (A quick warm-up to check understanding.)";

export function buildTasteExample(
  subject: string,
  gradeBand: string,
): { promptShown: string; sampleOutput: string } {
  const promptShown = `Write one quick quiz question for a ${gradeBand} ${subject} class`;
  const sampleOutput = SAMPLES[subject] ?? GENERIC;
  return { promptShown, sampleOutput };
}
