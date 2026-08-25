import type { ArchetypeId } from "./schema";

const LABEL_TO_ARCHETYPE: Record<string, ArchetypeId> = {
  // questionSet
  "3-tier worksheet": "questionSet",
  "AI-resilient assignment": "questionSet",
  "Exit-ticket set": "questionSet",
  "Oral-defence prompts": "questionSet",
  "Quiz": "questionSet",
  "Quiz-maker assistant": "questionSet",
  "Tiered homework": "questionSet",
  "Tiered question bank": "questionSet",
  "Worksheet": "questionSet",
  // outline
  "15-min mini-PD outline": "outline",
  "Attendance tracker steps": "outline",
  "Lesson-plan outline": "outline",
  "Meeting-notes format": "outline",
  // rubric
  "Progress-flag rules": "rubric",
  "Rubric": "rubric",
  // checklist
  "AI ground-rules one-pager": "checklist",
  "De-identify checklist": "checklist",
  "Do/Don't starter list": "checklist",
  "My AI-check checklist": "checklist",
  "Process checklist": "checklist",
  "Staff AI guidance one-pager": "checklist",
  "Student AI-use guidelines": "checklist",
  // letter
  "Class notice": "letter",
  "Email template": "letter",
  "Notice template": "letter",
  "Parent email": "letter",
  "Permission form": "letter",
  "Permission-slip template": "letter",
  // feedbackList
  "Comment bank": "feedbackList",
  "Feedback assistant": "feedbackList",
  "Feedback comments": "feedbackList",
  "Whole-class feedback summary": "feedbackList",
  // Deliberately absent (fall through to null/Generic): "Activity idea",
  // "Custom", "Explainer assistant", "Gradebook formula set".
};

/** Pure lookup. Unknown labels and null both fall back to Generic (null). */
export function archetypeForArtifactType(
  label: string | null,
): ArchetypeId | null {
  if (!label) return null;
  return LABEL_TO_ARCHETYPE[label] ?? null;
}
