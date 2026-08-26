import type { z } from "zod";
import type {
  questionSetSchema,
  outlineSchema,
  rubricSchema,
  checklistSchema,
  letterSchema,
  feedbackListSchema,
  ArchetypeId,
} from "./schema";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function formatQuestionSet(data: z.infer<typeof questionSetSchema>): string {
  const lines: string[] = [data.title, ""];
  if (data.instructions) lines.push(data.instructions, "");
  for (const q of data.questions) {
    lines.push(`Q${q.number}: ${q.prompt}`);
    if (q.options && q.options.length > 0) {
      lines.push("  " + q.options.map((o, i) => `${LETTERS[i] ?? i + 1}) ${o}`).join("  "));
    }
    lines.push("");
  }
  lines.push("--- Answer Key ---", "");
  for (const q of data.questions) {
    lines.push(`Answer: Q${q.number} — ${q.answer}`);
  }
  return lines.join("\n").trim();
}

export function formatOutline(data: z.infer<typeof outlineSchema>): string {
  const lines: string[] = [data.title, ""];
  for (const s of data.sections) {
    lines.push(s.timeEstimate ? `${s.heading} (${s.timeEstimate})` : s.heading);
    for (const b of s.bullets) lines.push(`  - ${b}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function formatRubric(data: z.infer<typeof rubricSchema>): string {
  const lines: string[] = [data.title, ""];
  for (const c of data.criteria) {
    lines.push(c.name);
    for (const lvl of c.levels) lines.push(`  ${lvl.label}: ${lvl.description}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function formatChecklist(data: z.infer<typeof checklistSchema>): string {
  const lines = [data.title, ""];
  for (const item of data.items) {
    lines.push(item.note ? `[ ] ${item.text} — ${item.note}` : `[ ] ${item.text}`);
  }
  return lines.join("\n");
}

export function formatLetter(data: z.infer<typeof letterSchema>): string {
  const lines: string[] = [];
  if (data.greeting) lines.push(data.greeting, "");
  lines.push(data.paragraphs.join("\n\n"));
  if (data.signOff) lines.push("", data.signOff);
  return lines.join("\n").trim();
}

export function formatFeedbackList(data: z.infer<typeof feedbackListSchema>): string {
  const lines = [data.title, ""];
  for (const item of data.items) {
    lines.push(item.label ? `${item.label}: ${item.comment}` : item.comment);
  }
  return lines.join("\n");
}

export const ARCHETYPE_TEXT_FORMATTERS: Record<
  ArchetypeId,
  (data: Record<string, unknown>) => string
> = {
  questionSet: formatQuestionSet as (data: Record<string, unknown>) => string,
  outline: formatOutline as (data: Record<string, unknown>) => string,
  rubric: formatRubric as (data: Record<string, unknown>) => string,
  checklist: formatChecklist as (data: Record<string, unknown>) => string,
  letter: formatLetter as (data: Record<string, unknown>) => string,
  feedbackList: formatFeedbackList as (data: Record<string, unknown>) => string,
};
