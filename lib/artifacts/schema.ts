import { z } from "zod";

export const questionSetSchema = z.object({
  title: z.string(),
  instructions: z.string().optional(),
  questions: z
    .array(
      z.object({
        number: z.number().int().positive(),
        prompt: z.string(),
        options: z.array(z.string()).optional(),
        answer: z.string(),
      }),
    )
    .min(1),
});

export const outlineSchema = z.object({
  title: z.string(),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        timeEstimate: z.string().optional(),
        bullets: z.array(z.string()).min(1),
      }),
    )
    .min(1),
});

export const rubricSchema = z.object({
  title: z.string(),
  criteria: z
    .array(
      z.object({
        name: z.string(),
        levels: z
          .array(z.object({ label: z.string(), description: z.string() }))
          .min(2),
      }),
    )
    .min(1),
});

export const checklistSchema = z.object({
  title: z.string(),
  items: z
    .array(z.object({ text: z.string(), note: z.string().optional() }))
    .min(1),
});

export const letterSchema = z.object({
  title: z.string(),
  greeting: z.string().optional(),
  paragraphs: z.array(z.string()).min(1),
  signOff: z.string().optional(),
});

export const feedbackListSchema = z.object({
  title: z.string(),
  items: z
    .array(z.object({ label: z.string().optional(), comment: z.string() }))
    .min(1),
});

export type ArchetypeId =
  | "questionSet"
  | "outline"
  | "rubric"
  | "checklist"
  | "letter"
  | "feedbackList";

export const ARCHETYPE_SCHEMAS: Record<ArchetypeId, z.ZodTypeAny> = {
  questionSet: questionSetSchema,
  outline: outlineSchema,
  rubric: rubricSchema,
  checklist: checklistSchema,
  letter: letterSchema,
  feedbackList: feedbackListSchema,
};
