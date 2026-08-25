import type { Profile } from "@/lib/data/types";
import { archetypeInstruction } from "@/lib/artifacts/prompt";
import type { ArchetypeId } from "@/lib/artifacts/schema";

export type AiMode = "playground" | "grade" | "taste";

export function buildSystemPrompt(
  profile: Pick<Profile, "role" | "subject" | "gradeBand">,
  mode: AiMode,
  archetype?: ArchetypeId | null,
): string {
  const who = `The user is a teacher${
    profile.subject ? ` who teaches ${profile.subject}` : ""
  }${profile.gradeBand ? ` at ${profile.gradeBand} level` : ""}.`;

  const base =
    `You are a warm, practical teaching assistant for educators building their AI confidence. ${who} ` +
    `Keep everything classroom-ready, concise, and in plain language — no jargon. ` +
    `Only help with teaching and education. If asked something unrelated, gently steer back to their teaching. ` +
    `Never include or invent a student's personal details.`;

  if (mode === "grade") {
    return (
      base +
      " You are grading the user's prompt against a rubric. Respond ONLY with the requested JSON, no prose."
    );
  }
  if (archetype) {
    return base + " " + archetypeInstruction(archetype);
  }
  return base;
}

/** Conservative off-topic gate — false negatives are fine, avoid false positives. */
export function isLikelyOffTopic(userText: string): boolean {
  const t = userText.trim();
  if (t.length === 0) return true;
  if (t.length > 4000) return true;
  return false;
}
