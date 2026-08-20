import { z } from "zod";

const optionSchema = z.object({ id: z.string(), text: z.string() });

const theorySchema = z.object({
  type: z.literal("theory"),
  id: z.string(),
  title: z.string().optional(),
  body: z.string(),
  image: z.string().optional(),
  goDeeper: z.string().optional(),
});

const mcqSchema = z.object({
  type: z.literal("mcq"),
  id: z.string(),
  question: z.string(),
  options: z.array(optionSchema).min(2),
  correctIds: z.array(z.string()).min(1),
  multi: z.boolean().optional(),
  explanation: z.string(),
});

const orderSchema = z.object({
  type: z.literal("order"),
  id: z.string(),
  prompt: z.string(),
  items: z.array(optionSchema).min(2),
  correctOrder: z.array(z.string()).min(1),
});

const fillBlankSchema = z.object({
  type: z.literal("fillBlank"),
  id: z.string(),
  template: z.string(),
  blanks: z
    .array(
      z.object({
        id: z.string(),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().min(0),
      }),
    )
    .min(1),
});

const reflectionSchema = z.object({
  type: z.literal("reflection"),
  id: z.string(),
  question: z.string(),
  scaleMax: z.number().int().optional(),
});

const promptWriteSchema = z.object({
  type: z.literal("promptWrite"),
  id: z.string(),
  brief: z.string(),
  rubric: z.array(z.string()).min(1),
});

const playgroundSchema = z.object({
  type: z.literal("playground"),
  id: z.string(),
  mode: z.enum(["make", "refine", "verify"]),
  artifactChoices: z.array(z.string()).optional(),
  scaffold: z.string(),
  saveToToolkit: z.boolean().optional(),
});

export const blockSchema = z.discriminatedUnion("type", [
  theorySchema,
  mcqSchema,
  orderSchema,
  fillBlankSchema,
  reflectionSchema,
  promptWriteSchema,
  playgroundSchema,
]);

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  estMinutes: z.number().int().positive(),
  goal: z.string(),
  mascot: z.string().optional(),
  blocks: z.array(blockSchema).min(1),
});

export type TheoryBlock = z.infer<typeof theorySchema>;
export type McqBlock = z.infer<typeof mcqSchema>;
export type OrderBlock = z.infer<typeof orderSchema>;
export type FillBlankBlock = z.infer<typeof fillBlankSchema>;
export type ReflectionBlock = z.infer<typeof reflectionSchema>;
export type PromptWriteBlock = z.infer<typeof promptWriteSchema>;
export type PlaygroundBlock = z.infer<typeof playgroundSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Lesson = z.infer<typeof lessonSchema>;

/** Block types that produce a pass/fail score. */
export const GRADABLE_TYPES = ["mcq", "order", "fillBlank", "promptWrite"] as const;

export function validateLesson(json: unknown): Lesson {
  return lessonSchema.parse(json);
}
