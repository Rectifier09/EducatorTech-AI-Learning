# Artifact Templates — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw-text AI output dump with a validated, structured
generation pipeline and a properly-formatted "Generic" fallback template —
the foundation the two follow-up plans (6 archetype templates, then PDF
export) build on.

**Architecture:** When a Playground block knows its target `artifactType`
(the lesson flow's pre-selected label like "Quiz" or "Parent email"), map it
to one of 6 document archetypes and ask the model for JSON matching that
archetype's schema instead of free prose. Validate with Zod; on success,
persist `template_type`/`structured` alongside the existing raw `output`
text. On any failure — bad JSON, wrong shape, empty content, or no
archetype at all (Studio Playground) — fall back to rendering `output`
through a small safe markdown-to-React formatter. One fallback mechanism
covers both "the model didn't cooperate" and "this predates the feature."

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Zod v4 (already
a dependency), Vitest + React Testing Library, Supabase Postgres.

**Spec:** `docs/superpowers/specs/2026-08-26-artifact-templates-design.md`
(this plan implements the "Data model", "Schemas", "Generation pipeline",
and the Generic-only slice of "Rendering architecture" sections; the 6
archetype-specific templates and PDF export are separate follow-up plans).

## Global Constraints

- TDD throughout: write the failing test, watch it fail, write minimal code
  to pass, watch it pass, then commit. This project's own convention, used
  in every prior session on this codebase.
- No new dependencies in this plan — `zod` is already in `package.json`.
- Never render AI-generated text via `dangerouslySetInnerHTML`. The Generic
  formatter builds real React elements from parsed segments; it never
  injects raw HTML strings.
- Reuse existing design tokens only (`--gold`, `--surface`, `--ink`, `--muted`,
  `var(--font-display)`, etc. from `app/globals.css`) — no new colors, no new
  visual language.
- This reuses the existing `generate()` call in `lib/ai/service.ts` verbatim
  (only the prompt content and post-processing change) — the cancel + 20s
  timeout + Gemini/Groq failover behavior already in place must keep working
  unmodified.
- Every new pure-logic file gets a co-located `*.test.ts`/`*.test.tsx`, run
  with `npx vitest run <path>`. Full-suite check (`npx vitest run`), `npx tsc
  --noEmit`, and `npm run lint` must all be clean before the final commit.

---

### Task 1: Migration — add `template_type` and `structured` columns

**Files:**
- Create: `supabase/migrations/0005_artifact_templates.sql`

**Interfaces:**
- Produces: two new nullable columns on `public.playground_sessions` —
  `template_type text` and `structured jsonb`. Every later task that reads
  or writes a `playground_sessions` row relies on these existing.

- [ ] **Step 1: Write the migration**

```sql
-- 0005_artifact_templates.sql
-- Adds structured-artifact columns to playground_sessions. Both nullable;
-- null means "render the Generic fallback from `output`" — covers both a
-- validation failure on a fresh generation and every pre-existing row.
alter table public.playground_sessions
  add column template_type text,
  add column structured jsonb;
```

- [ ] **Step 2: Apply it**

Run: `npm run db:migrate -- supabase/migrations/0005_artifact_templates.sql`
Expected: exits 0, no error output. This runs against the same Supabase
project used by both local dev and production (per this repo's existing
`db:migrate` script) — there is no separate dev database.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0005_artifact_templates.sql
git commit -m "Add template_type/structured columns to playground_sessions"
```

---

### Task 2: Archetype schemas

**Files:**
- Create: `lib/artifacts/schema.ts`
- Test: `lib/artifacts/schema.test.ts`

**Interfaces:**
- Produces: `type ArchetypeId = "questionSet" | "outline" | "rubric" |
  "checklist" | "letter" | "feedbackList"`; `ARCHETYPE_SCHEMAS: Record<ArchetypeId,
  z.ZodTypeAny>`; individually-exported schemas (`questionSetSchema`,
  `outlineSchema`, `rubricSchema`, `checklistSchema`, `letterSchema`,
  `feedbackListSchema`) for direct use in later tests.

- [ ] **Step 1: Write the failing test**

```ts
// lib/artifacts/schema.test.ts
import { describe, it, expect } from "vitest";
import { ARCHETYPE_SCHEMAS } from "./schema";

describe("ARCHETYPE_SCHEMAS", () => {
  it("questionSet accepts a valid quiz and rejects one with no questions", () => {
    const valid = {
      title: "Fractions Quiz",
      questions: [
        { number: 1, prompt: "What is 1/2 + 1/4?", answer: "3/4" },
      ],
    };
    expect(ARCHETYPE_SCHEMAS.questionSet.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.questionSet.safeParse({ title: "Empty", questions: [] })
        .success,
    ).toBe(false);
  });

  it("outline accepts a valid lesson plan and rejects a section with no bullets", () => {
    const valid = {
      title: "Photosynthesis — 40 min",
      sections: [
        { heading: "Warm-up", timeEstimate: "5 min", bullets: ["Ask what plants need to grow"] },
      ],
    };
    expect(ARCHETYPE_SCHEMAS.outline.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.outline.safeParse({
        title: "Bad",
        sections: [{ heading: "Empty section", bullets: [] }],
      }).success,
    ).toBe(false);
  });

  it("rubric accepts a valid rubric and rejects a criterion with only one level", () => {
    const valid = {
      title: "Essay Rubric",
      criteria: [
        {
          name: "Thesis",
          levels: [
            { label: "Developing", description: "States a topic" },
            { label: "Proficient", description: "States a clear argument" },
          ],
        },
      ],
    };
    expect(ARCHETYPE_SCHEMAS.rubric.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.rubric.safeParse({
        title: "Bad",
        criteria: [{ name: "Thesis", levels: [{ label: "Only one", description: "x" }] }],
      }).success,
    ).toBe(false);
  });

  it("checklist accepts a valid list and rejects an empty one", () => {
    const valid = { title: "AI-Check Checklist", items: [{ text: "Verify facts" }] };
    expect(ARCHETYPE_SCHEMAS.checklist.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.checklist.safeParse({ title: "Empty", items: [] }).success,
    ).toBe(false);
  });

  it("letter accepts a valid letter and rejects one with no paragraphs", () => {
    const valid = {
      title: "Parent Email",
      greeting: "Dear families,",
      paragraphs: ["This week we studied fractions."],
      signOff: "Warmly, Ms. Rao",
    };
    expect(ARCHETYPE_SCHEMAS.letter.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.letter.safeParse({ title: "Empty", paragraphs: [] }).success,
    ).toBe(false);
  });

  it("feedbackList accepts a valid list and rejects an empty one", () => {
    const valid = { title: "Comment Bank", items: [{ comment: "Great effort on the intro." }] };
    expect(ARCHETYPE_SCHEMAS.feedbackList.safeParse(valid).success).toBe(true);
    expect(
      ARCHETYPE_SCHEMAS.feedbackList.safeParse({ title: "Empty", items: [] }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/artifacts/schema.test.ts`
Expected: FAIL — `Cannot find module './schema'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/artifacts/schema.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/artifacts/schema.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/artifacts/schema.ts lib/artifacts/schema.test.ts
git commit -m "Add Zod schemas for the 6 artifact archetypes"
```

---

### Task 3: Label → archetype mapping

**Files:**
- Create: `lib/artifacts/mapping.ts`
- Test: `lib/artifacts/mapping.test.ts`

**Interfaces:**
- Consumes: `ArchetypeId` from `./schema` (Task 2).
- Produces: `archetypeForArtifactType(label: string | null): ArchetypeId |
  null`. `lib/ai/handler.ts` (Task 7) is the primary caller.

- [ ] **Step 1: Write the failing test**

```ts
// lib/artifacts/mapping.test.ts
import { describe, it, expect } from "vitest";
import { archetypeForArtifactType } from "./mapping";

describe("archetypeForArtifactType", () => {
  it("maps question-set-shaped labels", () => {
    expect(archetypeForArtifactType("Quiz")).toBe("questionSet");
    expect(archetypeForArtifactType("Worksheet")).toBe("questionSet");
    expect(archetypeForArtifactType("Tiered question bank")).toBe("questionSet");
  });

  it("maps outline-shaped labels", () => {
    expect(archetypeForArtifactType("Lesson-plan outline")).toBe("outline");
    expect(archetypeForArtifactType("Attendance tracker steps")).toBe("outline");
  });

  it("maps rubric-shaped labels", () => {
    expect(archetypeForArtifactType("Rubric")).toBe("rubric");
    expect(archetypeForArtifactType("Progress-flag rules")).toBe("rubric");
  });

  it("maps checklist-shaped labels", () => {
    expect(archetypeForArtifactType("De-identify checklist")).toBe("checklist");
    expect(archetypeForArtifactType("Student AI-use guidelines")).toBe("checklist");
  });

  it("maps letter-shaped labels", () => {
    expect(archetypeForArtifactType("Parent email")).toBe("letter");
    expect(archetypeForArtifactType("Permission form")).toBe("letter");
  });

  it("maps feedback-list-shaped labels", () => {
    expect(archetypeForArtifactType("Comment bank")).toBe("feedbackList");
    expect(archetypeForArtifactType("Whole-class feedback summary")).toBe("feedbackList");
  });

  it("returns null for Generic-only labels, unknown labels, and null", () => {
    expect(archetypeForArtifactType("Custom")).toBeNull();
    expect(archetypeForArtifactType("Activity idea")).toBeNull();
    expect(archetypeForArtifactType("Some future label nobody mapped yet")).toBeNull();
    expect(archetypeForArtifactType(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/artifacts/mapping.test.ts`
Expected: FAIL — `Cannot find module './mapping'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/artifacts/mapping.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/artifacts/mapping.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/artifacts/mapping.ts lib/artifacts/mapping.test.ts
git commit -m "Add artifactType label to archetype mapping"
```

---

### Task 4: Per-archetype JSON prompt instructions

**Files:**
- Create: `lib/artifacts/prompt.ts`
- Test: `lib/artifacts/prompt.test.ts`

**Interfaces:**
- Consumes: `ArchetypeId` from `./schema` (Task 2).
- Produces: `archetypeInstruction(archetype: ArchetypeId): string`. Consumed
  by `lib/ai/guardrails.ts` (Task 6).

- [ ] **Step 1: Write the failing test**

```ts
// lib/artifacts/prompt.test.ts
import { describe, it, expect } from "vitest";
import { archetypeInstruction } from "./prompt";
import { ARCHETYPE_SCHEMAS, type ArchetypeId } from "./schema";

describe("archetypeInstruction", () => {
  it("returns a non-empty JSON-only instruction for every archetype", () => {
    for (const archetype of Object.keys(ARCHETYPE_SCHEMAS) as ArchetypeId[]) {
      const instruction = archetypeInstruction(archetype);
      expect(instruction.length).toBeGreaterThan(0);
      expect(instruction).toMatch(/JSON/);
    }
  });

  it("names the archetype's own field names so the model can match them", () => {
    expect(archetypeInstruction("questionSet")).toMatch(/questions/);
    expect(archetypeInstruction("rubric")).toMatch(/criteria/);
    expect(archetypeInstruction("letter")).toMatch(/paragraphs/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/artifacts/prompt.test.ts`
Expected: FAIL — `Cannot find module './prompt'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/artifacts/prompt.ts
import type { ArchetypeId } from "./schema";

const INSTRUCTIONS: Record<ArchetypeId, string> = {
  questionSet:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "instructions": string (optional), ' +
    '"questions": [{"number": integer starting at 1, "prompt": string, ' +
    '"options": string[] (optional — include only for multiple-choice), ' +
    '"answer": string}]}.',
  outline:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "sections": [{"heading": string, ' +
    '"timeEstimate": string (optional, e.g. "10 min"), "bullets": string[]}]}.',
  rubric:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "criteria": [{"name": string, "levels": ' +
    '[{"label": string, "description": string}] (at least 2 levels, ordered ' +
    'low to high)}]}.',
  checklist:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "items": [{"text": string, "note": string ' +
    "(optional)}]}.",
  letter:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "greeting": string (optional), ' +
    '"paragraphs": string[], "signOff": string (optional)}.',
  feedbackList:
    'Respond ONLY with JSON, no prose, no markdown fences, matching exactly ' +
    'this shape: {"title": string, "items": [{"label": string (optional), ' +
    '"comment": string}]}.',
};

export function archetypeInstruction(archetype: ArchetypeId): string {
  return INSTRUCTIONS[archetype];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/artifacts/prompt.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/artifacts/prompt.ts lib/artifacts/prompt.test.ts
git commit -m "Add per-archetype JSON generation instructions"
```

---

### Task 5: Extract-and-validate helper

**Files:**
- Create: `lib/artifacts/generateStructured.ts`
- Test: `lib/artifacts/generateStructured.test.ts`

**Interfaces:**
- Consumes: `ARCHETYPE_SCHEMAS`, `ArchetypeId` from `./schema` (Task 2).
- Produces: `extractAndValidate(text: string, archetype: ArchetypeId):
  unknown | null`. Consumed by `lib/ai/handler.ts` (Task 7).

- [ ] **Step 1: Write the failing test**

```ts
// lib/artifacts/generateStructured.test.ts
import { describe, it, expect } from "vitest";
import { extractAndValidate } from "./generateStructured";

describe("extractAndValidate", () => {
  it("parses and validates strict JSON", () => {
    const text = '{"title":"Quiz","questions":[{"number":1,"prompt":"1+1?","answer":"2"}]}';
    const result = extractAndValidate(text, "questionSet") as { title: string };
    expect(result?.title).toBe("Quiz");
  });

  it("extracts JSON wrapped in prose or markdown fences", () => {
    const text =
      'Sure! Here you go:\n```json\n{"title":"Quiz","questions":[{"number":1,"prompt":"1+1?","answer":"2"}]}\n```';
    const result = extractAndValidate(text, "questionSet") as { title: string };
    expect(result?.title).toBe("Quiz");
  });

  it("returns null on malformed JSON", () => {
    expect(extractAndValidate("not json at all", "questionSet")).toBeNull();
  });

  it("returns null when the JSON is valid but doesn't match the schema", () => {
    const text = '{"title":"Quiz","questions":[]}'; // empty questions fails .min(1)
    expect(extractAndValidate(text, "questionSet")).toBeNull();
  });

  it("returns null when the JSON matches a different archetype's shape", () => {
    const text = '{"title":"Letter","paragraphs":["Hi"]}';
    expect(extractAndValidate(text, "questionSet")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/artifacts/generateStructured.test.ts`
Expected: FAIL — `Cannot find module './generateStructured'`

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/artifacts/generateStructured.ts
import { ARCHETYPE_SCHEMAS, type ArchetypeId } from "./schema";

/**
 * Same braces-extraction technique as lib/ai/gradePrompt.ts's parseGrade —
 * tolerates prose preambles and ```json fences around the JSON blob.
 * Returns the validated, typed data, or null on any failure (bad JSON,
 * wrong shape, empty required arrays) so the caller can fall back to
 * rendering the raw text through the Generic template.
 */
export function extractAndValidate(
  text: string,
  archetype: ArchetypeId,
): unknown | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const obj: unknown = JSON.parse(text.slice(start, end + 1));
    const result = ARCHETYPE_SCHEMAS[archetype].safeParse(obj);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/artifacts/generateStructured.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/artifacts/generateStructured.ts lib/artifacts/generateStructured.test.ts
git commit -m "Add JSON extract-and-validate helper for structured generation"
```

---

### Task 6: `buildSystemPrompt` gains an archetype parameter

**Files:**
- Modify: `lib/ai/guardrails.ts`
- Modify: `lib/ai/guardrails.test.ts`

**Interfaces:**
- Consumes: `archetypeInstruction` from `@/lib/artifacts/prompt` (Task 4),
  `ArchetypeId` from `@/lib/artifacts/schema` (Task 2).
- Produces: `buildSystemPrompt(profile, mode, archetype?: ArchetypeId |
  null): string` — the `archetype` parameter is new and optional; every
  existing call site (`lib/ai/handler.ts`, `lib/ai/gradePrompt.ts`) keeps
  working unchanged since it's optional. Consumed by `lib/ai/handler.ts`
  (Task 7).

- [ ] **Step 1: Write the failing test**

```ts
// add to lib/ai/guardrails.test.ts, inside describe("buildSystemPrompt", ...)
  it("appends the archetype's JSON instruction when one is given", () => {
    const p = buildSystemPrompt(
      { role: null, subject: null, gradeBand: null },
      "playground",
      "questionSet",
    );
    expect(p).toMatch(/JSON/);
    expect(p).toMatch(/questions/);
  });

  it("has no archetype instruction when none is given", () => {
    const p = buildSystemPrompt(
      { role: null, subject: null, gradeBand: null },
      "playground",
    );
    expect(p).not.toMatch(/JSON/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ai/guardrails.test.ts`
Expected: FAIL — first new test fails because `buildSystemPrompt` ignores
the third argument today (output won't contain "JSON"/"questions").

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/ai/guardrails.ts — full new contents
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ai/guardrails.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/guardrails.ts lib/ai/guardrails.test.ts
git commit -m "buildSystemPrompt: append archetype JSON instruction when given"
```

---

### Task 7: Wire archetype detection into `handleGenerate`

**Files:**
- Modify: `lib/ai/handler.ts`
- Modify: `lib/ai/handler.test.ts`

**Interfaces:**
- Consumes: `archetypeForArtifactType` (Task 3), `extractAndValidate` (Task
  5), the updated `buildSystemPrompt` (Task 6).
- Produces: `handleGenerate` gains an `artifactType?: string | null` input
  field. `GenerateResponse`'s success branch grows to `{ text: string;
  templateType?: string | null; structured?: unknown }`. Consumed by
  `app/api/ai/generate/route.ts` (Task 8).

- [ ] **Step 1: Write the failing test**

```ts
// add to lib/ai/handler.test.ts, inside describe("handleGenerate", ...)
  it("requests structured JSON and returns templateType/structured on success", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({
      text: '{"title":"Quiz","questions":[{"number":1,"prompt":"1+1?","answer":"2"}]}',
      provider: "gemini",
    });
    const r = await handleGenerate({
      userText: "Make a quiz",
      mode: "playground",
      artifactType: "Quiz",
    });
    expect(r).toMatchObject({
      templateType: "questionSet",
      structured: { title: "Quiz" },
    });
    // the system prompt handed to generate() must carry the JSON instruction
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ system: expect.stringMatching(/JSON/) }),
    );
  });

  it("falls back to plain text when the model ignores the JSON instruction", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Sure, here's a quiz idea...", provider: "gemini" });
    const r = await handleGenerate({
      userText: "Make a quiz",
      mode: "playground",
      artifactType: "Quiz",
    });
    expect(r).toMatchObject({ text: "Sure, here's a quiz idea..." });
    expect((r as { templateType?: unknown }).templateType).toBeUndefined();
  });

  it("skips JSON-mode entirely when artifactType has no archetype", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Here's an activity idea", provider: "gemini" });
    const r = await handleGenerate({
      userText: "Give me an idea",
      mode: "playground",
      artifactType: "Activity idea",
    });
    expect(r).toMatchObject({ text: "Here's an activity idea" });
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ system: expect.not.stringMatching(/JSON/) }),
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ai/handler.test.ts`
Expected: FAIL — `handleGenerate` doesn't accept `artifactType` yet and
never returns `templateType`/`structured`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/ai/handler.ts — full new contents
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { checkRateLimit } from "./rateLimit";
import { buildSystemPrompt, isLikelyOffTopic, type AiMode } from "./guardrails";
import { generate } from "./service";
import { logEvent } from "@/lib/data/events";
import { archetypeForArtifactType } from "@/lib/artifacts/mapping";
import { extractAndValidate } from "@/lib/artifacts/generateStructured";

export type GenerateResponse =
  | { text: string; templateType?: string | null; structured?: unknown }
  | { error: string; code: string };

export async function handleGenerate({
  userText,
  mode,
  signal,
  artifactType = null,
}: {
  userText: string;
  mode: AiMode;
  signal?: AbortSignal;
  artifactType?: string | null;
}): Promise<GenerateResponse> {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in.", code: "unauthorized" };

  if (isLikelyOffTopic(userText)) {
    return {
      text: "I'm here to help with your teaching — try asking for a worksheet, quiz, or lesson idea.",
    };
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return {
      error:
        "You've done a lot of creating today 👏 — the free AI takes a breather. Come back tomorrow and keep going.",
      code: "rate_limited",
    };
  }

  const archetype = archetypeForArtifactType(artifactType);
  const profile = await getProfile(user.id);
  const system = buildSystemPrompt(
    {
      role: profile?.role ?? null,
      subject: profile?.subject ?? null,
      gradeBand: profile?.gradeBand ?? null,
    },
    mode,
    archetype,
  );

  try {
    const result = await generate({ system, user: userText, signal });
    await logEvent("ai_generate", { mode, provider: result.provider });
    if (archetype) {
      const structured = extractAndValidate(result.text, archetype);
      if (structured) {
        return { text: result.text, templateType: archetype, structured };
      }
    }
    return { text: result.text };
  } catch {
    return {
      error: "Hmm, that didn't go through. Let's try again.",
      code: "provider_error",
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ai/handler.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/handler.ts lib/ai/handler.test.ts
git commit -m "handleGenerate: request+validate structured JSON for known archetypes"
```

---

### Task 8: Forward `artifactType` through the API route and client

**Files:**
- Modify: `app/api/ai/generate/route.ts`
- Modify: `lib/ai/client.ts`

**Interfaces:**
- Consumes: `handleGenerate`'s new `artifactType` field (Task 7).
- Produces: `requestGenerate(userText, mode, signal?, artifactType?):
  Promise<GenerateReply>` where `GenerateReply`'s success branch grows to
  `{ text: string; templateType?: string | null; structured?: unknown }`.
  Consumed by `components/playground/Playground.tsx` (Task 10).

No dedicated test file for this task — both files are thin request/response
passthroughs with no independent test today (consistent with this
codebase's existing convention: neither file has ever had one). Coverage
comes from Task 7's unit tests plus Task 10's component test and the final
manual verification in Task 12.

- [ ] **Step 1: Update the route to read and forward `artifactType`**

```ts
// app/api/ai/generate/route.ts — full new contents
import { NextResponse } from "next/server";
import { handleGenerate } from "@/lib/ai/handler";
import type { AiMode } from "@/lib/ai/guardrails";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userText: string = typeof body.userText === "string" ? body.userText : "";
  const mode: AiMode = body.mode ?? "playground";
  const artifactType: string | null =
    typeof body.artifactType === "string" ? body.artifactType : null;

  const result = await handleGenerate({
    userText,
    mode,
    signal: request.signal,
    artifactType,
  });

  if ("error" in result) {
    const status =
      result.code === "unauthorized"
        ? 401
        : result.code === "rate_limited"
          ? 429
          : 502;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
```

- [ ] **Step 2: Update the client to send it**

```ts
// lib/ai/client.ts — full new contents
import type { AiMode } from "./guardrails";

export type GenerateReply =
  | { text: string; templateType?: string | null; structured?: unknown }
  | { error: string; code: string };

export async function requestGenerate(
  userText: string,
  mode: AiMode = "playground",
  signal?: AbortSignal,
  artifactType?: string | null,
): Promise<GenerateReply> {
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, mode, artifactType }),
      signal,
    });
    return (await res.json()) as GenerateReply;
  } catch {
    return { error: "Network hiccup — try again.", code: "network" };
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (this task's changes are additive/optional fields; no
call site is broken yet since Task 10 updates `Playground.tsx`'s call next).

- [ ] **Step 4: Commit**

```bash
git add app/api/ai/generate/route.ts lib/ai/client.ts
git commit -m "Forward artifactType through the generate API route and client"
```

---

### Task 9: Persist `templateType`/`structured` through the data layer

**Files:**
- Modify: `lib/data/types.ts`
- Modify: `lib/data/toolkit.ts`
- Modify: `app/actions/toolkit.ts`

**Interfaces:**
- Produces: `PlaygroundSession` (and thus `SavedArtifact`) gain
  `templateType: string | null` and `structured: Record<string, unknown> |
  null`. `saveArtifact`'s and `saveToToolkit`'s input types gain optional
  `templateType`/`structured` fields, persisted into the new columns from
  Task 1. Consumed by `app/create/page.tsx` (Task 11) and
  `components/playground/Playground.tsx` / `PlaygroundBlockView.tsx` (Task
  10).

No dedicated new test: `lib/data/toolkit.test.ts`'s existing coverage is
`artifactTitle`, whose input type/behavior is unchanged by this task. The
DB-calling functions (`saveArtifact`, `listArtifacts`) have never had direct
tests in this codebase (consistent existing convention) — this task is
plumbing, verified end-to-end in Task 12's manual check.

- [ ] **Step 1: Add the two fields to `PlaygroundSession`**

```ts
// lib/data/types.ts — replace the PlaygroundSession interface
export interface PlaygroundSession {
  userId: string;
  lessonId: string | null;
  artifactType: string | null;
  templateType: string | null;
  structured: Record<string, unknown> | null;
  prompt: string;
  output: string;
  savedToToolkit: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: Map and persist the new columns**

```ts
// lib/data/toolkit.ts — apply these edits

// PlaygroundRow interface: add after `artifact_type: string | null;`
  template_type: string | null;
  structured: Record<string, unknown> | null;

// rowToArtifact: add after `artifactType: row.artifact_type,`
    templateType: row.template_type,
    structured: row.structured,

// saveArtifact's input type: add after `artifactType?: string | null;`
    templateType?: string | null;
    structured?: Record<string, unknown> | null;

// saveArtifact's .insert({...}) call: add after `artifact_type: input.artifactType ?? null,`
      template_type: input.templateType ?? null,
      structured: input.structured ?? null,
```

- [ ] **Step 3: Thread the fields through the server action**

```ts
// app/actions/toolkit.ts — full new contents
"use server";

import { getSessionUser } from "@/lib/auth";
import { saveArtifact, deleteArtifact } from "@/lib/data/toolkit";
import { logEvent } from "@/lib/data/events";

export async function saveToToolkit(input: {
  trackId?: string | null;
  lessonId?: string | null;
  artifactType?: string | null;
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  prompt: string;
  output: string;
}): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await saveArtifact(user.id, input);
  await logEvent("artifact_saved", {
    artifactType: input.artifactType ?? null,
    trackId: input.trackId ?? null,
    lessonId: input.lessonId ?? null,
  });
}

export async function deleteToolkitItem(id: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await deleteArtifact(user.id, id);
  await logEvent("artifact_deleted", { id });
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/data/types.ts lib/data/toolkit.ts app/actions/toolkit.ts
git commit -m "Persist templateType/structured through the toolkit data layer"
```

---

### Task 10: Light markdown formatter + Generic template

**Files:**
- Create: `lib/artifacts/formatText.tsx`
- Test: `lib/artifacts/formatText.test.tsx`
- Create: `components/artifacts/templates/Generic.tsx`
- Test: `components/artifacts/templates/Generic.test.tsx`

**Interfaces:**
- Produces: `formatLightMarkdown(text: string): ReactNode[]` — real React
  elements, never `dangerouslySetInnerHTML`. `Generic({ output: string })`
  — a presentational component. Consumed by `ArtifactRenderer` (Task 11).

- [ ] **Step 1: Write the failing formatter test**

```tsx
// lib/artifacts/formatText.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { formatLightMarkdown } from "./formatText";

describe("formatLightMarkdown", () => {
  it("renders **bold** as a real <strong>, not literal asterisks", () => {
    const { container } = render(<div>{formatLightMarkdown("This is **important**.")}</div>);
    expect(container.querySelector("strong")?.textContent).toBe("important");
    expect(container.textContent).not.toContain("**");
  });

  it("renders a '### heading' line as bold text, not literal hashes", () => {
    const { container } = render(<div>{formatLightMarkdown("### Instructions")}</div>);
    expect(container.textContent).toContain("Instructions");
    expect(container.textContent).not.toContain("#");
  });

  it("preserves plain lines with no markdown untouched", () => {
    const { container } = render(<div>{formatLightMarkdown("Just a plain sentence.")}</div>);
    expect(container.textContent).toContain("Just a plain sentence.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/artifacts/formatText.test.tsx`
Expected: FAIL — `Cannot find module './formatText'`

- [ ] **Step 3: Write the formatter**

```tsx
// lib/artifacts/formatText.tsx
import type { ReactNode } from "react";

/**
 * Minimal, safe formatter for AI prose. Turns "### heading" lines into
 * bold headings and "**bold**" spans into real <strong> elements — never
 * dangerouslySetInnerHTML, since this text comes straight from the model.
 */
export function formatLightMarkdown(text: string): ReactNode[] {
  return text.split("\n").map((line, i) => {
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    const content = headingMatch ? headingMatch[1] : line;
    const parts = content
      .split(/(\*\*[^*]+\*\*)/g)
      .filter((part) => part.length > 0)
      .map((part, j) => {
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
        return boldMatch ? <strong key={j}>{boldMatch[1]}</strong> : part;
      });
    const body = parts.length > 0 ? parts : " ";
    return headingMatch ? (
      <p key={i} className="mt-3 font-bold text-ink first:mt-0">
        {body}
      </p>
    ) : (
      <p key={i} className="text-muted">
        {body}
      </p>
    );
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/artifacts/formatText.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the failing Generic template test**

```tsx
// components/artifacts/templates/Generic.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Generic } from "./Generic";

describe("Generic", () => {
  it("renders the output text with markdown formatted, not literal", () => {
    render(<Generic output="Here is your **worksheet**." />);
    expect(screen.getByText("worksheet").tagName).toBe("STRONG");
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/Generic.test.tsx`
Expected: FAIL — `Cannot find module './Generic'`

- [ ] **Step 7: Write the Generic template**

```tsx
// components/artifacts/templates/Generic.tsx
import { formatLightMarkdown } from "@/lib/artifacts/formatText";

export function Generic({ output }: { output: string }) {
  return (
    <div className="flex flex-col gap-1 text-[14px] leading-relaxed">
      {formatLightMarkdown(output)}
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/Generic.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 9: Commit**

```bash
git add lib/artifacts/formatText.tsx lib/artifacts/formatText.test.tsx \
        components/artifacts/templates/Generic.tsx \
        components/artifacts/templates/Generic.test.tsx
git commit -m "Add safe markdown formatter and the Generic artifact template"
```

---

### Task 11: `ArtifactRenderer` dispatcher

**Files:**
- Create: `components/artifacts/ArtifactRenderer.tsx`
- Test: `components/artifacts/ArtifactRenderer.test.tsx`

**Interfaces:**
- Consumes: `Generic` from `./templates/Generic` (Task 10).
- Produces: `ArtifactRenderer({ templateType?, structured?, output }):
  JSX.Element`. This is the stable public interface both
  `components/playground/Playground.tsx` and
  `components/toolkit/ArtifactCard.tsx` (Task 10 of *this* plan is Task 10
  above — the following two are Tasks 12 and 13) render through. Only
  Generic exists today; the follow-up plan adds real archetype branches
  here without changing this interface.

- [ ] **Step 1: Write the failing test**

```tsx
// components/artifacts/ArtifactRenderer.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactRenderer } from "./ArtifactRenderer";

describe("ArtifactRenderer", () => {
  it("renders Generic when templateType is null", () => {
    render(<ArtifactRenderer templateType={null} output="Plain **text**." />);
    expect(screen.getByText("text").tagName).toBe("STRONG");
  });

  it("renders Generic for an unrecognized templateType (forward-compat placeholder)", () => {
    render(<ArtifactRenderer templateType="somethingNotBuiltYet" output="Fallback **content**." />);
    expect(screen.getByText("content").tagName).toBe("STRONG");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/ArtifactRenderer.test.tsx`
Expected: FAIL — `Cannot find module './ArtifactRenderer'`

- [ ] **Step 3: Write the dispatcher**

```tsx
// components/artifacts/ArtifactRenderer.tsx
import { Generic } from "./templates/Generic";

export interface ArtifactRendererProps {
  templateType?: string | null;
  structured?: unknown;
  output: string;
}

/**
 * Dispatches to the on-screen template matching `templateType`. Only
 * Generic exists so far — the 6 archetype-specific templates land in a
 * follow-up plan as additional branches here; this interface (and every
 * call site) stays stable when they're added.
 */
export function ArtifactRenderer({ output }: ArtifactRendererProps) {
  return <Generic output={output} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/ArtifactRenderer.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/ArtifactRenderer.tsx components/artifacts/ArtifactRenderer.test.tsx
git commit -m "Add ArtifactRenderer dispatcher (Generic-only for now)"
```

---

### Task 12: Wire `Playground.tsx` and `PlaygroundBlockView.tsx`

**Files:**
- Modify: `components/playground/Playground.tsx`
- Modify: `components/playground/Playground.test.tsx`
- Modify: `components/lesson/blocks/PlaygroundBlockView.tsx` (no dedicated
  test file exists for this component today; this is a small,
  signature-forwarding change folded into this task per the "fold setup
  into the task whose deliverable needs it" rule)

**Interfaces:**
- Consumes: `requestGenerate` with its new 4th `artifactType` parameter
  (Task 8), `ArtifactRenderer` (Task 11).
- Produces: `Playground`'s `onResult` prop type grows from `(text, prompt)
  => void` to `(text: string, prompt: string, templateType?: string | null,
  structured?: unknown) => void`.

- [ ] **Step 1: Write the failing test**

```tsx
// add to components/playground/Playground.test.tsx
it("passes artifactType through to requestGenerate when set", async () => {
  requestGenerate.mockResolvedValue({ text: "Here is a quiz" });
  render(<Playground scaffold="Make a quiz" artifactType="Quiz" />);
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));

  await waitFor(() => expect(requestGenerate).toHaveBeenCalled());
  const [, , , artifactType] = requestGenerate.mock.calls[0];
  expect(artifactType).toBe("Quiz");
});

it("renders the result through ArtifactRenderer, formatting markdown", async () => {
  requestGenerate.mockResolvedValue({ text: "Here is your **quiz**." });
  render(<Playground scaffold="Make a quiz" />);
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));

  await waitFor(() => expect(screen.getByText("quiz").tagName).toBe("STRONG"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/playground/Playground.test.tsx`
Expected: FAIL — `requestGenerate` is currently called with only 3
arguments, and the raw output div doesn't format markdown.

- [ ] **Step 3: Update `Playground.tsx`**

```tsx
// components/playground/Playground.tsx — full new contents
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { requestGenerate } from "@/lib/ai/client";
import { saveToToolkit } from "@/app/actions/toolkit";
import type { AiMode } from "@/lib/ai/guardrails";
import { useAnimatedEllipsis } from "@/hooks/useAnimatedEllipsis";
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";

export function Playground({
  scaffold,
  mode = "playground",
  seedContent,
  context = null,
  onResult,
  allowSave = true,
  artifactType = null,
  lessonId = null,
}: {
  scaffold: string;
  mode?: AiMode;
  seedContent?: string;
  /** Prior material to refine — shown read-only and prepended to the request. */
  context?: string | null;
  onResult?: (
    text: string,
    prompt: string,
    templateType?: string | null,
    structured?: unknown,
  ) => void;
  allowSave?: boolean;
  artifactType?: string | null;
  lessonId?: string | null;
}) {
  const [prompt, setPrompt] = useState(seedContent ?? scaffold);
  const [output, setOutput] = useState<string | null>(null);
  const [templateType, setTemplateType] = useState<string | null>(null);
  const [structured, setStructured] = useState<unknown>(null);
  const [error, setError] = useState<{ msg: string; rate: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const dots = useAnimatedEllipsis(busy);

  async function save() {
    if (!output || saved) return;
    setSaved(true);
    await saveToToolkit({ prompt, output, artifactType, templateType, structured: structured as Record<string, unknown> | null, lessonId });
  }

  async function run() {
    if (busy || !prompt.trim()) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setError(null);
    setOutput(null);
    setTemplateType(null);
    setStructured(null);
    setSaved(false);
    const userText = context
      ? `Here is my current material:\n\n${context}\n\nNow do this: ${prompt}`
      : prompt;
    const r = await requestGenerate(userText, mode, controller.signal, artifactType);
    if (controller.signal.aborted) return; // cancelled — UI already reset
    setBusy(false);
    if ("error" in r) {
      setError({ msg: r.error, rate: r.code === "rate_limited" });
      return;
    }
    setOutput(r.text);
    setTemplateType(r.templateType ?? null);
    setStructured(r.structured ?? null);
    onResult?.(r.text, prompt, r.templateType, r.structured);
  }

  function cancel() {
    controllerRef.current?.abort();
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {context && (
        <div className="rounded-2xl border border-line bg-sunk p-4">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-faint">
            Refining your earlier material
          </p>
          <div className="max-h-40 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
            {context}
          </div>
        </div>
      )}
      <p className="text-xs text-faint">
        Tip: keep students&apos; personal details out — no names or private info.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder="Your instructions to the AI…"
        className="rounded-2xl border-[1.5px] border-line-2 bg-sunk p-4 text-[15px] leading-relaxed text-ink placeholder:text-faint transition focus-visible:border-brand focus-visible:shadow-[var(--glow-gold)] focus-visible:outline-none"
      />
      <Button
        variant="primary"
        onClick={run}
        disabled={busy || !prompt.trim()}
        className="w-full"
      >
        {busy ? `Thinking${dots}` : "Generate"}
      </Button>
      {busy && (
        <button
          onClick={cancel}
          className="self-center text-[13px] font-extrabold text-muted underline"
        >
          Cancel
        </button>
      )}

      {error && (
        <div
          className={
            error.rate
              ? "rounded-2xl border border-line-2 bg-surface-2 p-4 text-[14px]"
              : "rounded-2xl border border-coral/40 bg-coral/10 p-4 text-[14px]"
          }
        >
          <p
            className={
              error.rate ? "font-bold text-ink" : "font-bold text-coral"
            }
          >
            {error.rate ? "Daily limit reached" : "That didn't go through"}
          </p>
          <p className="mt-1 text-muted">{error.msg}</p>
          {!error.rate && (
            <button
              onClick={run}
              className="mt-2 font-extrabold text-brand-ink underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {output && (
        <div className="rounded-2xl border border-line bg-sunk p-4">
          <ArtifactRenderer
            templateType={templateType}
            structured={structured}
            output={output}
          />
        </div>
      )}
      {output && allowSave && (
        <Button
          variant={saved ? "ghost" : "primary"}
          onClick={save}
          disabled={saved}
          className="w-full"
        >
          {saved ? "Saved to Toolkit ✓" : "Save to Toolkit"}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/playground/Playground.test.tsx`
Expected: PASS (all tests, including the pre-existing cancel/indicator ones)

- [ ] **Step 5: Update `PlaygroundBlockView.tsx`'s `onResult` to forward the new fields**

```tsx
// components/lesson/blocks/PlaygroundBlockView.tsx — replace the onResult handler
        onResult={(text, prompt, templateType, structured) => {
          onArtifact(text);
          setProduced(true);
          if (block.saveToToolkit !== false) {
            void saveToToolkit({
              prompt,
              output: text,
              artifactType: choice || null,
              templateType: templateType ?? null,
              structured: (structured as Record<string, unknown> | null) ?? null,
              trackId,
              lessonId,
            });
          }
        }}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/playground/Playground.tsx components/playground/Playground.test.tsx \
        components/lesson/blocks/PlaygroundBlockView.tsx
git commit -m "Wire Playground through ArtifactRenderer and thread artifactType/templateType"
```

---

### Task 13: Wire `ArtifactCard.tsx` and `app/create/page.tsx`

**Files:**
- Modify: `components/toolkit/ArtifactCard.tsx`
- Modify: `components/toolkit/ArtifactCard.test.tsx`
- Modify: `app/create/page.tsx`

**Interfaces:**
- Consumes: `ArtifactRenderer` (Task 11), `SavedArtifact.templateType` /
  `.structured` (Task 9).
- Produces: `ArtifactCard` gains optional `templateType`/`structured` props
  (default `null`), so every existing call site and test keeps working
  unchanged unless it opts in.

- [ ] **Step 1: Write the failing test**

```tsx
// add to components/toolkit/ArtifactCard.test.tsx
it("renders the output through ArtifactRenderer, formatting markdown", () => {
  render(
    <ArtifactCard
      id="a1"
      title="Worksheet · Fractions"
      output="Here is your **worksheet**."
      createdAt="2026-08-20T10:00:00.000Z"
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "View" }));
  expect(screen.getByText("worksheet").tagName).toBe("STRONG");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/toolkit/ArtifactCard.test.tsx`
Expected: FAIL — the card currently shows the raw string
`"Here is your **worksheet**."` in a plain div, so no `<strong>` exists.

- [ ] **Step 3: Update `ArtifactCard.tsx`**

```tsx
// components/toolkit/ArtifactCard.tsx — apply these edits

// Add to the import list:
import { ArtifactRenderer } from "@/components/artifacts/ArtifactRenderer";

// Add two new props to the function signature (after `output`):
  templateType = null,
  structured = null,
// ...and to the type below it:
  templateType?: string | null;
  structured?: unknown;

// Replace the raw output div:
          <div className="mt-4 max-h-64 overflow-auto rounded-2xl border border-line-2 bg-sunk p-4 text-[13px] leading-relaxed text-muted">
            <ArtifactRenderer
              templateType={templateType}
              structured={structured}
              output={output}
            />
          </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/toolkit/ArtifactCard.test.tsx`
Expected: PASS (all tests, including the pre-existing delete-flow ones)

- [ ] **Step 5: Pass the fields through from the page**

```tsx
// app/create/page.tsx — update the <ArtifactCard> call
              <ArtifactCard
                key={a.id}
                id={a.id}
                title={artifactTitle(a)}
                output={a.output}
                createdAt={a.createdAt}
                templateType={a.templateType}
                structured={a.structured}
              />
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/toolkit/ArtifactCard.tsx components/toolkit/ArtifactCard.test.tsx \
        app/create/page.tsx
git commit -m "Wire ArtifactCard through ArtifactRenderer"
```

---

### Task 14: Full verification and manual check

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: all tests pass, including every pre-existing suite (cancel/timeout
work from prior sessions, delete-flow tests, etc.) — this task's changes
must not regress anything.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors or warnings beyond the 2 pre-existing unrelated
`react-hooks/exhaustive-deps` warnings in `hooks/useCollapsibleHeader.ts`.

- [ ] **Step 4: Manual browser check (dev server)**

With `npm run dev` running:
1. Go to `/create` (Studio Playground, no `artifactType`). Generate
   something. Confirm the result now shows real bold/headings instead of
   literal `**`/`###` — this is the Generic-everywhere fix, visible
   immediately even without any archetype-specific template yet.
2. Play through a lesson block that has `artifactChoices` (e.g. the
   `build-helper` track's "make" block), picking "Worksheet" or "Quiz" as
   the choice. Confirm generation still completes normally (cancel + the
   animated "Thinking…" indicator from the prior session must still work
   here — this is the regression risk called out in Global Constraints).
3. Open the Toolkit (`My Toolkit` on `/create`) and expand a freshly-saved
   card. Confirm it renders through `ArtifactRenderer` (formatted, not raw).
4. Optional but useful: temporarily log `r` in `handleGenerate` or check
   Supabase directly to confirm a `Quiz`/`Worksheet` generation actually
   populated `template_type: 'questionSet'` and a non-null `structured`
   column — this confirms the JSON-mode path is firing, even though every
   template still renders as Generic until the next plan adds the
   type-specific ones.

- [ ] **Step 5: Report**

No commit for this task (verification only) — report the outcome and any
issues found back before moving to Plan 2 (the 6 archetype templates).
