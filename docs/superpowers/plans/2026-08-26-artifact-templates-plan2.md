# Artifact Templates Plan 2: Per-Archetype Rendering + PDF Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary Generic/flattened-text fallback with a real,
elegant, purpose-built visual template for each of the 6 archetypes from
Plan 1, and let teachers download any artifact as a matching PDF.

**Architecture:** Six new on-screen template components dispatched by
`ArtifactRenderer` (which today always renders `Generic`); a matching set
of six `react-pdf` "twin" components dispatched the same way by a
`DownloadPdfButton`; a per-archetype plain-text formatter module that
replaces Plan 1's generic flattening for `output`/Copy/verify/refine.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zod, Vitest + React
Testing Library, `@react-pdf/renderer` (new dependency, added in Task 11).

**Spec:** `docs/superpowers/specs/2026-08-26-artifact-templates-plan2-design.md`
(read this too — it explains the *why* behind each decision below; this
plan is its argument, not a replacement for it).

## Global Constraints

- TDD required for every behavior change (test first, watch it fail,
  minimal code, watch it pass).
- No `dangerouslySetInnerHTML` anywhere.
- On-screen templates use only existing CSS-custom-property design tokens
  (`--font-display`, `--font-sans`, `--ink`, `--muted`, `--faint`,
  `--line`, `--line-2`, `--sunk`, `--surface`, `--brand-ink`, `--coral`) —
  no new colors, no new spacing scale.
- `@react-pdf/renderer` is the only new dependency this plan introduces.
- **PDF page background is light (white), not the app's dark theme.** The
  app (`app/globals.css`) is a single warm-dark theme (`--paper: #171319`,
  `--ink: #f4eee4`) meant for on-screen viewing; a PDF worksheet is meant
  to be printed and handed to a student, so it must be light-on-dark text,
  not the inverse. `pdfStyles.ts` (Task 11) uses the app's actual token
  *values* for its accent and text colors (`--gold` `#eab54d` for
  headings, `--line-2` `#332b3a` for body text, `--faint` `#6e6577` for
  muted text) against a white page — this is the one deliberate departure
  from "reuse the dark theme verbatim," and it is deliberate for
  printability, not an arbitrary new color choice.
- Every new pure-logic file gets a co-located test.
- Must not regress: the cancel/timeout/animated-indicator behavior, the
  Toolkit delete flow, or Plan 1's dispatch fallback for pre-existing rows
  (`template_type`/`structured` both `null`) and Playground-freeform
  results (`artifactType` unresolved).
- Checklist items are static display only — never interactive/tappable
  (confirmed with the user during brainstorming).
- Test command: `npx vitest run <path>`. Typecheck: `npx tsc --noEmit`.
  Lint: `npm run lint`.

---

### Task 1: Shared on-screen template primitives

**Files:**
- Create: `components/artifacts/templates/primitives.tsx`
- Test: `components/artifacts/templates/primitives.test.tsx`

**Interfaces:**
- Produces: `ArtifactHeading({ children: ReactNode })`,
  `Pill({ children: ReactNode })`,
  `ListRow({ icon?: ReactNode, children: ReactNode })` — used by Tasks 2, 3,
  5, 7 (QuestionSet, Outline, Checklist, FeedbackList). Rubric and Letter
  (Tasks 4, 6) do not use these.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactHeading, Pill, ListRow } from "./primitives";

describe("artifact template primitives", () => {
  it("ArtifactHeading renders its children as the heading text", () => {
    render(<ArtifactHeading>Fractions Quiz</ArtifactHeading>);
    expect(screen.getByText("Fractions Quiz")).toBeInTheDocument();
  });

  it("Pill renders its children inside a badge", () => {
    render(<Pill>5 min</Pill>);
    expect(screen.getByText("5 min")).toBeInTheDocument();
  });

  it("ListRow renders an optional icon alongside its content", () => {
    render(<ListRow icon={<span data-testid="icon">*</span>}>Row content</ListRow>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Row content")).toBeInTheDocument();
  });

  it("ListRow renders without an icon", () => {
    render(<ListRow>No icon here</ListRow>);
    expect(screen.getByText("No icon here")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/primitives.test.tsx`
Expected: FAIL — `./primitives` has no exports (module not found).

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { ReactNode } from "react";

export function ArtifactHeading({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[16px] font-semibold text-ink"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </p>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-sunk px-2.5 py-0.5 text-[11px] font-bold text-muted">
      {children}
    </span>
  );
}

export function ListRow({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1 text-[14px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/primitives.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/templates/primitives.tsx components/artifacts/templates/primitives.test.tsx
git commit -m "Add shared on-screen primitives for artifact templates"
```

---

### Task 2: QuestionSet template

**Files:**
- Create: `components/artifacts/templates/QuestionSet.tsx`
- Test: `components/artifacts/templates/QuestionSet.test.tsx`

**Interfaces:**
- Consumes: `ArtifactHeading`, `ListRow` from `./primitives` (Task 1);
  `questionSetSchema` from `@/lib/artifacts/schema` (already exists).
- Produces: `QuestionSet({ data: z.infer<typeof questionSetSchema> })` —
  consumed by `ArtifactRenderer` (Task 9).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionSet } from "./QuestionSet";

const sample = {
  title: "Fractions Quiz",
  instructions: "Show your work.",
  questions: [
    {
      number: 1,
      prompt: "What is 1/2 + 1/4?",
      options: ["1/4", "3/4", "1"],
      answer: "3/4",
    },
  ],
};

describe("QuestionSet", () => {
  it("renders the title, instructions, and question prompt with lettered options", () => {
    render(<QuestionSet data={sample} />);
    expect(screen.getByText("Fractions Quiz")).toBeInTheDocument();
    expect(screen.getByText("Show your work.")).toBeInTheDocument();
    expect(screen.getByText("What is 1/2 + 1/4?")).toBeInTheDocument();
    expect(screen.getByText("A) 1/4")).toBeInTheDocument();
  });

  it("hides the answer key until the toggle is clicked", () => {
    render(<QuestionSet data={sample} />);
    expect(screen.queryByText("1. 3/4")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show answer key" }));
    expect(screen.getByText("1. 3/4")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/QuestionSet.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
"use client";

import { useState } from "react";
import type { z } from "zod";
import type { questionSetSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, ListRow } from "./primitives";

type QuestionSetData = z.infer<typeof questionSetSchema>;

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionSet({ data }: { data: QuestionSetData }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <ArtifactHeading>{data.title}</ArtifactHeading>
        {data.instructions && (
          <p className="mt-1 text-[13px] italic text-faint">{data.instructions}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {data.questions.map((q) => (
          <ListRow
            key={q.number}
            icon={
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sunk text-[12px] font-bold text-ink">
                {q.number}
              </span>
            }
          >
            <p>{q.prompt}</p>
            {q.options && q.options.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1 text-[13px] text-muted">
                {q.options.map((opt, i) => (
                  <li key={i}>
                    {LETTERS[i] ?? i + 1}) {opt}
                  </li>
                ))}
              </ul>
            )}
          </ListRow>
        ))}
      </div>
      <div>
        <button
          onClick={() => setShowAnswers((s) => !s)}
          className="text-[13px] font-extrabold text-brand-ink underline underline-offset-2"
        >
          {showAnswers ? "Hide answer key" : "Show answer key"}
        </button>
        {showAnswers && (
          <ul className="mt-2 flex flex-col gap-1 rounded-xl border border-line-2 bg-sunk p-3 text-[13px] text-muted">
            {data.questions.map((q) => (
              <li key={q.number}>
                {q.number}. {q.answer}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/QuestionSet.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/templates/QuestionSet.tsx components/artifacts/templates/QuestionSet.test.tsx
git commit -m "Add QuestionSet artifact template with collapsed answer key"
```

---

### Task 3: Outline template

**Files:**
- Create: `components/artifacts/templates/Outline.tsx`
- Test: `components/artifacts/templates/Outline.test.tsx`

**Interfaces:**
- Consumes: `ArtifactHeading`, `Pill` from `./primitives` (Task 1);
  `outlineSchema` from `@/lib/artifacts/schema`.
- Produces: `Outline({ data: z.infer<typeof outlineSchema> })` — consumed
  by `ArtifactRenderer` (Task 9).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Outline } from "./Outline";

describe("Outline", () => {
  it("renders each section's heading, time estimate, and bullets", () => {
    render(
      <Outline
        data={{
          title: "Fractions Lesson",
          sections: [
            { heading: "Warm-up", timeEstimate: "5 min", bullets: ["Review prior work"] },
          ],
        }}
      />,
    );
    expect(screen.getByText("Fractions Lesson")).toBeInTheDocument();
    expect(screen.getByText("Warm-up")).toBeInTheDocument();
    expect(screen.getByText("5 min")).toBeInTheDocument();
    expect(screen.getByText("Review prior work")).toBeInTheDocument();
  });

  it("omits the pill when timeEstimate is absent", () => {
    render(
      <Outline
        data={{
          title: "Fractions Lesson",
          sections: [{ heading: "Warm-up", bullets: ["Review prior work"] }],
        }}
      />,
    );
    expect(screen.queryByText(/min$/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/Outline.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { z } from "zod";
import type { outlineSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, Pill } from "./primitives";

type OutlineData = z.infer<typeof outlineSchema>;

export function Outline({ data }: { data: OutlineData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-3">
        {data.sections.map((s, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-ink">{s.heading}</p>
              {s.timeEstimate && <Pill>{s.timeEstimate}</Pill>}
            </div>
            <ul className="flex flex-col gap-0.5 pl-4 text-[13px] text-muted">
              {s.bullets.map((b, j) => (
                <li key={j} className="list-disc">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/Outline.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/templates/Outline.tsx components/artifacts/templates/Outline.test.tsx
git commit -m "Add Outline artifact template"
```

---

### Task 4: Rubric template

**Files:**
- Create: `components/artifacts/templates/Rubric.tsx`
- Test: `components/artifacts/templates/Rubric.test.tsx`

**Interfaces:**
- Consumes: `ArtifactHeading` from `./primitives` (Task 1); `rubricSchema`
  from `@/lib/artifacts/schema`.
- Produces: `Rubric({ data: z.infer<typeof rubricSchema> })` — consumed by
  `ArtifactRenderer` (Task 9).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Rubric } from "./Rubric";

describe("Rubric", () => {
  it("renders each criterion's name and its levels' labels and descriptions", () => {
    render(
      <Rubric
        data={{
          title: "Essay Rubric",
          criteria: [
            {
              name: "Argument",
              levels: [
                { label: "Strong", description: "Clear thesis throughout." },
                { label: "Developing", description: "Thesis present but unclear." },
              ],
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("Essay Rubric")).toBeInTheDocument();
    expect(screen.getByText("Argument")).toBeInTheDocument();
    expect(screen.getByText("Strong:")).toBeInTheDocument();
    expect(screen.getByText("Clear thesis throughout.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/Rubric.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { z } from "zod";
import type { rubricSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading } from "./primitives";

type RubricData = z.infer<typeof rubricSchema>;

export function Rubric({ data }: { data: RubricData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-4">
        {data.criteria.map((c, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <p className="text-[14px] font-bold text-ink">{c.name}</p>
            <div className="flex flex-col gap-1 pl-1">
              {c.levels.map((lvl, j) => (
                <p key={j} className="text-[13px] text-muted">
                  <span className="font-bold text-ink">{lvl.label}: </span>
                  {lvl.description}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/Rubric.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/templates/Rubric.tsx components/artifacts/templates/Rubric.test.tsx
git commit -m "Add Rubric artifact template"
```

---

### Task 5: Checklist template

**Files:**
- Create: `components/artifacts/templates/Checklist.tsx`
- Test: `components/artifacts/templates/Checklist.test.tsx`

**Interfaces:**
- Consumes: `ArtifactHeading`, `ListRow` from `./primitives` (Task 1);
  `checklistSchema` from `@/lib/artifacts/schema`.
- Produces: `Checklist({ data: z.infer<typeof checklistSchema> })` —
  consumed by `ArtifactRenderer` (Task 9). Static display only — no
  interactive state (confirmed scope decision).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Checklist } from "./Checklist";

describe("Checklist", () => {
  it("renders each item's text and optional note", () => {
    render(
      <Checklist
        data={{
          title: "De-identify Checklist",
          items: [
            { text: "Remove student names", note: "including in filenames" },
            { text: "Blur faces in photos" },
          ],
        }}
      />,
    );
    expect(screen.getByText("De-identify Checklist")).toBeInTheDocument();
    expect(screen.getByText("Remove student names")).toBeInTheDocument();
    expect(screen.getByText("— including in filenames")).toBeInTheDocument();
    expect(screen.getByText("Blur faces in photos")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/Checklist.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { z } from "zod";
import type { checklistSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, ListRow } from "./primitives";

type ChecklistData = z.infer<typeof checklistSchema>;

export function Checklist({ data }: { data: ChecklistData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-2.5">
        {data.items.map((item, i) => (
          <ListRow
            key={i}
            icon={<span className="block h-4 w-4 rounded border border-line-2" />}
          >
            <span>{item.text}</span>
            {item.note && (
              <span className="ml-1.5 text-[12px] text-faint">— {item.note}</span>
            )}
          </ListRow>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/Checklist.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/templates/Checklist.tsx components/artifacts/templates/Checklist.test.tsx
git commit -m "Add Checklist artifact template (static display)"
```

---

### Task 6: Letter template

**Files:**
- Create: `components/artifacts/templates/Letter.tsx`
- Test: `components/artifacts/templates/Letter.test.tsx`

**Interfaces:**
- Consumes: `letterSchema` from `@/lib/artifacts/schema`. No primitives —
  a letter doesn't use the worksheet-style `ArtifactHeading`; its own
  `title` field is used only by the existing `artifactTitle()` logic for
  the Toolkit card's title (unchanged, not touched by this task).
- Produces: `Letter({ data: z.infer<typeof letterSchema> })` — consumed by
  `ArtifactRenderer` (Task 9).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Letter } from "./Letter";

describe("Letter", () => {
  it("renders greeting, paragraphs, and sign-off when present", () => {
    render(
      <Letter
        data={{
          title: "Parent Email",
          greeting: "Dear families,",
          paragraphs: ["We have a field trip next week."],
          signOff: "Warmly, Ms. Rao",
        }}
      />,
    );
    expect(screen.getByText("Dear families,")).toBeInTheDocument();
    expect(screen.getByText("We have a field trip next week.")).toBeInTheDocument();
    expect(screen.getByText("Warmly, Ms. Rao")).toBeInTheDocument();
  });

  it("omits greeting and sign-off when absent", () => {
    render(<Letter data={{ title: "Notice", paragraphs: ["School closes early Friday."] }} />);
    expect(screen.getByText("School closes early Friday.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/Letter.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { z } from "zod";
import type { letterSchema } from "@/lib/artifacts/schema";

type LetterData = z.infer<typeof letterSchema>;

export function Letter({ data }: { data: LetterData }) {
  return (
    <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-ink">
      {data.greeting && (
        <p style={{ fontFamily: "var(--font-display)" }}>{data.greeting}</p>
      )}
      {data.paragraphs.map((p, i) => (
        <p key={i} className="text-muted">
          {p}
        </p>
      ))}
      {data.signOff && <p style={{ fontFamily: "var(--font-display)" }}>{data.signOff}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/Letter.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/templates/Letter.tsx components/artifacts/templates/Letter.test.tsx
git commit -m "Add Letter artifact template"
```

---

### Task 7: FeedbackList template

**Files:**
- Create: `components/artifacts/templates/FeedbackList.tsx`
- Test: `components/artifacts/templates/FeedbackList.test.tsx`

**Interfaces:**
- Consumes: `ArtifactHeading`, `ListRow` from `./primitives` (Task 1);
  `feedbackListSchema` from `@/lib/artifacts/schema`.
- Produces: `FeedbackList({ data: z.infer<typeof feedbackListSchema> })` —
  consumed by `ArtifactRenderer` (Task 9).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeedbackList } from "./FeedbackList";

describe("FeedbackList", () => {
  it("renders each item's optional label and its comment", () => {
    render(
      <FeedbackList
        data={{
          title: "Comment Bank",
          items: [
            { label: "Strength", comment: "Clear topic sentences." },
            { comment: "Consider adding a conclusion." },
          ],
        }}
      />,
    );
    expect(screen.getByText("Comment Bank")).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByText("Clear topic sentences.")).toBeInTheDocument();
    expect(screen.getByText("Consider adding a conclusion.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/templates/FeedbackList.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { z } from "zod";
import type { feedbackListSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, ListRow } from "./primitives";

type FeedbackListData = z.infer<typeof feedbackListSchema>;

export function FeedbackList({ data }: { data: FeedbackListData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-2.5">
        {data.items.map((item, i) => (
          <ListRow key={i}>
            {item.label && (
              <span className="mr-1.5 rounded-full bg-sunk px-2 py-0.5 text-[11px] font-bold text-muted">
                {item.label}
              </span>
            )}
            <span>{item.comment}</span>
          </ListRow>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/templates/FeedbackList.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/templates/FeedbackList.tsx components/artifacts/templates/FeedbackList.test.tsx
git commit -m "Add FeedbackList artifact template"
```

---

### Task 8: Per-archetype text formatters

**Files:**
- Create: `lib/artifacts/formatArchetypeText.ts`
- Test: `lib/artifacts/formatArchetypeText.test.ts`

**Interfaces:**
- Consumes: all 6 schemas + `ArchetypeId` from `@/lib/artifacts/schema`
  (already exists).
- Produces: `formatQuestionSet`, `formatOutline`, `formatRubric`,
  `formatChecklist`, `formatLetter`, `formatFeedbackList` (each
  `(data: <archetype's inferred type>) => string`), and
  `ARCHETYPE_TEXT_FORMATTERS: Record<ArchetypeId, (data: Record<string, unknown>) => string>`
  — consumed by `lib/ai/handler.ts` (Task 10).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import {
  formatQuestionSet,
  formatOutline,
  formatRubric,
  formatChecklist,
  formatLetter,
  formatFeedbackList,
} from "./formatArchetypeText";

describe("formatArchetypeText", () => {
  it("formats a question set with the title, numbered questions, lettered options, and an answer line", () => {
    const text = formatQuestionSet({
      title: "Quiz",
      questions: [{ number: 1, prompt: "1+1?", options: ["1", "2"], answer: "2" }],
    });
    expect(text).toContain("Quiz");
    expect(text).toContain("Q1: 1+1?");
    expect(text).toContain("A) 1");
    expect(text).toContain("B) 2");
    expect(text).toContain("Answer: 2");
  });

  it("formats an outline with the title, headings, time estimates, and indented bullets", () => {
    const text = formatOutline({
      title: "Lesson",
      sections: [{ heading: "Warm-up", timeEstimate: "5 min", bullets: ["Review"] }],
    });
    expect(text).toContain("Lesson");
    expect(text).toContain("Warm-up (5 min)");
    expect(text).toContain("- Review");
  });

  it("formats a rubric with the title, criterion names, and indented level lines", () => {
    const text = formatRubric({
      title: "Rubric",
      criteria: [
        { name: "Argument", levels: [{ label: "Strong", description: "Clear thesis." }] },
      ],
    });
    expect(text).toContain("Rubric");
    expect(text).toContain("Argument");
    expect(text).toContain("Strong: Clear thesis.");
  });

  it("formats a checklist as a title followed by bracket lines with optional notes", () => {
    const text = formatChecklist({
      title: "Checklist",
      items: [{ text: "Remove names", note: "and filenames" }, { text: "Blur faces" }],
    });
    expect(text).toBe("Checklist\n\n[ ] Remove names — and filenames\n[ ] Blur faces");
  });

  it("formats a letter with greeting, paragraphs, and sign-off (no title)", () => {
    const text = formatLetter({
      title: "Notice",
      greeting: "Dear families,",
      paragraphs: ["Field trip next week."],
      signOff: "Warmly, Ms. Rao",
    });
    expect(text).toBe("Dear families,\n\nField trip next week.\n\nWarmly, Ms. Rao");
  });

  it("formats a feedback list as a title followed by optional-label lines", () => {
    const text = formatFeedbackList({
      title: "Comment Bank",
      items: [
        { label: "Strength", comment: "Clear writing." },
        { comment: "Add a conclusion." },
      ],
    });
    expect(text).toBe("Comment Bank\n\nStrength: Clear writing.\nAdd a conclusion.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/artifacts/formatArchetypeText.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
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
    lines.push(`Answer: ${q.answer}`, "");
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/artifacts/formatArchetypeText.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/artifacts/formatArchetypeText.ts lib/artifacts/formatArchetypeText.test.ts
git commit -m "Add per-archetype plain-text formatters"
```

---

### Task 9: Wire ArtifactRenderer to dispatch by templateType

**Files:**
- Modify: `components/artifacts/ArtifactRenderer.tsx`
- Modify: `components/artifacts/ArtifactRenderer.test.tsx`

**Interfaces:**
- Consumes: `QuestionSet` (Task 2), `Outline` (Task 3), `Rubric` (Task 4),
  `Checklist` (Task 5), `Letter` (Task 6), `FeedbackList` (Task 7), all 6
  schemas + `ArchetypeId` from `@/lib/artifacts/schema`, existing
  `Generic` from `./templates/Generic`.
- Produces: `ArtifactRendererProps` unchanged
  (`{ templateType?: string | null; structured?: Record<string, unknown> | null; output: string }`)
  — no call site (`Playground.tsx`, `ArtifactCard.tsx`) needs to change,
  since both already pass `templateType`/`structured`/`output` from Plan 1.

The current file (from Plan 1) is:

```tsx
import { Generic } from "./templates/Generic";

export interface ArtifactRendererProps {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}

export function ArtifactRenderer({ output }: ArtifactRendererProps) {
  return <Generic output={output} />;
}
```

- [ ] **Step 1: Write the failing tests**

Append these cases to the existing `describe("ArtifactRenderer", ...)`
block in `components/artifacts/ArtifactRenderer.test.tsx` (keep the two
existing tests unchanged):

```tsx
  it("renders QuestionSet when templateType is questionSet", () => {
    render(
      <ArtifactRenderer
        templateType="questionSet"
        structured={{
          title: "Quiz",
          questions: [{ number: 1, prompt: "1+1?", answer: "2" }],
        }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("1+1?")).toBeInTheDocument();
  });

  it("renders Outline when templateType is outline", () => {
    render(
      <ArtifactRenderer
        templateType="outline"
        structured={{ title: "Lesson", sections: [{ heading: "Warm-up", bullets: ["Review"] }] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Warm-up")).toBeInTheDocument();
  });

  it("renders Rubric when templateType is rubric", () => {
    render(
      <ArtifactRenderer
        templateType="rubric"
        structured={{
          title: "Rubric",
          criteria: [{ name: "Argument", levels: [{ label: "Strong", description: "Clear." }] }],
        }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Argument")).toBeInTheDocument();
  });

  it("renders Checklist when templateType is checklist", () => {
    render(
      <ArtifactRenderer
        templateType="checklist"
        structured={{ title: "Checklist", items: [{ text: "Remove names" }] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Remove names")).toBeInTheDocument();
  });

  it("renders Letter when templateType is letter", () => {
    render(
      <ArtifactRenderer
        templateType="letter"
        structured={{ title: "Notice", paragraphs: ["Field trip next week."] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Field trip next week.")).toBeInTheDocument();
  });

  it("renders FeedbackList when templateType is feedbackList", () => {
    render(
      <ArtifactRenderer
        templateType="feedbackList"
        structured={{ title: "Comment Bank", items: [{ comment: "Nice work." }] }}
        output="fallback text"
      />,
    );
    expect(screen.getByText("Nice work.")).toBeInTheDocument();
  });

  it("renders Generic when templateType is set but structured is missing", () => {
    render(
      <ArtifactRenderer templateType="questionSet" output="Plain **fallback**." />,
    );
    expect(screen.getByText("fallback").tagName).toBe("STRONG");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/ArtifactRenderer.test.tsx`
Expected: FAIL — the 7 new cases fail (every `templateType` still renders
`Generic`, so e.g. `screen.getByText("1+1?")` isn't found); the 2
pre-existing cases still pass.

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { z } from "zod";
import {
  type ArchetypeId,
  questionSetSchema,
  outlineSchema,
  rubricSchema,
  checklistSchema,
  letterSchema,
  feedbackListSchema,
} from "@/lib/artifacts/schema";
import { Generic } from "./templates/Generic";
import { QuestionSet } from "./templates/QuestionSet";
import { Outline } from "./templates/Outline";
import { Rubric } from "./templates/Rubric";
import { Checklist } from "./templates/Checklist";
import { Letter } from "./templates/Letter";
import { FeedbackList } from "./templates/FeedbackList";

export interface ArtifactRendererProps {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}

/**
 * Dispatches to the on-screen template matching `templateType`. Unknown
 * or unrecognized `templateType`, or a missing `structured` payload,
 * always falls back to Generic — this is what keeps every pre-Plan-1 row
 * and every Playground-freeform result rendering unchanged.
 */
export function ArtifactRenderer({
  templateType,
  structured,
  output,
}: ArtifactRendererProps) {
  if (structured) {
    switch (templateType as ArchetypeId | null | undefined) {
      case "questionSet":
        return <QuestionSet data={structured as z.infer<typeof questionSetSchema>} />;
      case "outline":
        return <Outline data={structured as z.infer<typeof outlineSchema>} />;
      case "rubric":
        return <Rubric data={structured as z.infer<typeof rubricSchema>} />;
      case "checklist":
        return <Checklist data={structured as z.infer<typeof checklistSchema>} />;
      case "letter":
        return <Letter data={structured as z.infer<typeof letterSchema>} />;
      case "feedbackList":
        return <FeedbackList data={structured as z.infer<typeof feedbackListSchema>} />;
    }
  }
  return <Generic output={output} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/ArtifactRenderer.test.tsx`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/ArtifactRenderer.tsx components/artifacts/ArtifactRenderer.test.tsx
git commit -m "Wire ArtifactRenderer to dispatch by templateType across all 6 archetypes"
```

---

### Task 10: Wire handler.ts to use per-archetype text formatters

**Files:**
- Modify: `lib/ai/handler.ts`
- Modify: `lib/ai/handler.test.ts`

**Interfaces:**
- Consumes: `ARCHETYPE_TEXT_FORMATTERS` from
  `@/lib/artifacts/formatArchetypeText` (Task 8).
- Produces: no change to `GenerateResponse`'s shape — only what `text`
  contains for a successful structured generation changes (from Plan 1's
  generic flatten to the matching archetype's formatted text).

The relevant current block (from Plan 1's fix) is:

```ts
    if (archetype) {
      const structured = extractAndValidate(result.text, archetype);
      if (structured) {
        return {
          text: flattenStructuredToText(structured),
          templateType: archetype,
          structured,
        };
      }
    }
    return { text: result.text };
```

- [ ] **Step 1: Write the failing test**

Add this test to the existing `describe("handleGenerate", ...)` block in
`lib/ai/handler.test.ts` (the mocks and `beforeEach` already in that file
are reused as-is):

```ts
  it("uses the archetype's own text formatter, not the generic flatten, for successful structured JSON", async () => {
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
    expect((r as { text: string }).text).toContain("Q1: 1+1?");
    expect((r as { text: string }).text).toContain("Answer: 2");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/ai/handler.test.ts`
Expected: FAIL — the new test fails (current `text` is the generic
flatten, e.g. `"title: Quiz\nquestions:\n  1. ..."`, which does not
contain the literal string `"Q1: 1+1?"`); all pre-existing tests still
pass.

- [ ] **Step 3: Write minimal implementation**

In `lib/ai/handler.ts`, add the import:

```ts
import { ARCHETYPE_TEXT_FORMATTERS } from "@/lib/artifacts/formatArchetypeText";
```

(keep the existing `import { flattenStructuredToText } from "@/lib/artifacts/flatten";`
import — it is still used as the defensive fallback below). Replace the
block shown above with:

```ts
    if (archetype) {
      const structured = extractAndValidate(result.text, archetype);
      if (structured) {
        let text: string;
        try {
          text = ARCHETYPE_TEXT_FORMATTERS[archetype](structured);
        } catch {
          text = flattenStructuredToText(structured);
        }
        return { text, templateType: archetype, structured };
      }
    }
    return { text: result.text };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/ai/handler.test.ts`
Expected: PASS (all tests, including the new one)

- [ ] **Step 5: Commit**

```bash
git add lib/ai/handler.ts lib/ai/handler.test.ts
git commit -m "Use per-archetype text formatters instead of generic flatten in handleGenerate"
```

---

### Task 11: PDF foundation — dependency, shared styles, GenericPdf

This is the first task to touch `@react-pdf/renderer` — it establishes the
dependency and the one shared style sheet every PDF twin uses, and proves
the library actually works end-to-end in this repo's Vitest setup before
the remaining 6 twins are built on top of it.

**Files:**
- Modify: `package.json` (add dependency)
- Create: `components/artifacts/pdf/pdfStyles.ts`
- Create: `components/artifacts/pdf/GenericPdf.tsx`
- Test: `components/artifacts/pdf/GenericPdf.test.tsx`

**Interfaces:**
- Produces: `pdfStyles` (a `@react-pdf/renderer` `StyleSheet`) — consumed
  by every PDF twin in Tasks 12-17. `GenericPdf({ output: string })` —
  consumed by `buildPdfDocument` (Task 18).

- [ ] **Step 1: Install the dependency**

```bash
npm install @react-pdf/renderer
```

- [ ] **Step 2: Write the failing test**

`@react-pdf/renderer`'s `pdf(...).toBuffer()` targets Node, not a browser
DOM — this test file overrides Vitest's per-file environment to `node`
(this repo's default Vitest environment is `jsdom`, needed for React
Testing Library elsewhere, but not for react-pdf) via the special
first-line comment Vitest recognizes:

```tsx
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { GenericPdf } from "./GenericPdf";

describe("GenericPdf", () => {
  it("builds a PDF from plain text without throwing", async () => {
    await expect(
      pdf(<GenericPdf output={"Line one\nLine two"} />).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF from empty text without throwing", async () => {
    await expect(pdf(<GenericPdf output={""} />).toBuffer()).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/GenericPdf.test.tsx`
Expected: FAIL — `./GenericPdf` and `./pdfStyles` do not exist yet.

- [ ] **Step 4: Write minimal implementation**

`components/artifacts/pdf/pdfStyles.ts`:

```ts
import { StyleSheet } from "@react-pdf/renderer";

// Light, printable page — the app's own theme (app/globals.css) is dark
// and meant for on-screen viewing; a worksheet PDF is meant to be printed
// and handed to a student, so this deliberately inverts to light-on-dark
// text. Colors are still the app's real token *values*, not new ones:
// #eab54d is --gold, #332b3a is --line-2, #6e6577 is --faint.
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#332b3a",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#eab54d",
    marginBottom: 12,
  },
  subheading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#332b3a",
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  muted: {
    fontSize: 10,
    color: "#6e6577",
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
});
```

`components/artifacts/pdf/GenericPdf.tsx`:

```tsx
import { Document, Page, Text } from "@react-pdf/renderer";
import { pdfStyles } from "./pdfStyles";

export function GenericPdf({ output }: { output: string }) {
  const lines = output.length > 0 ? output.split("\n") : [""];
  return (
    <Document>
      <Page style={pdfStyles.page}>
        {lines.map((line, i) => (
          <Text key={i} style={pdfStyles.body}>
            {line || " "}
          </Text>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/GenericPdf.test.tsx`
Expected: PASS (2 tests). **If this fails for environment reasons** (a
Node/font/canvas error unrelated to the component logic), that is a real
signal to investigate `@react-pdf/renderer`'s installed version and
Node compatibility before proceeding to Task 12 — do not work around it
by weakening the assertion; the remaining 6 PDF tasks depend on this
working.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/artifacts/pdf/pdfStyles.ts components/artifacts/pdf/GenericPdf.tsx components/artifacts/pdf/GenericPdf.test.tsx
git commit -m "Add @react-pdf/renderer, shared PDF styles, and GenericPdf twin"
```

---

### Task 12: QuestionSetPdf twin

**Files:**
- Create: `components/artifacts/pdf/QuestionSetPdf.tsx`
- Test: `components/artifacts/pdf/QuestionSetPdf.test.tsx`

**Interfaces:**
- Consumes: `pdfStyles` (Task 11), `questionSetSchema` from
  `@/lib/artifacts/schema`.
- Produces: `QuestionSetPdf({ data: z.infer<typeof questionSetSchema> })`
  — consumed by `buildPdfDocument` (Task 18).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { QuestionSetPdf } from "./QuestionSetPdf";

describe("QuestionSetPdf", () => {
  it("builds a PDF from a typical question set without throwing", async () => {
    await expect(
      pdf(
        <QuestionSetPdf
          data={{
            title: "Quiz",
            instructions: "Show your work.",
            questions: [
              { number: 1, prompt: "1+1?", options: ["1", "2"], answer: "2" },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF when optional fields are omitted", async () => {
    await expect(
      pdf(
        <QuestionSetPdf
          data={{ title: "Quiz", questions: [{ number: 1, prompt: "1+1?", answer: "2" }] }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/QuestionSetPdf.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { questionSetSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type QuestionSetData = z.infer<typeof questionSetSchema>;
const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionSetPdf({ data }: { data: QuestionSetData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.instructions && <Text style={pdfStyles.muted}>{data.instructions}</Text>}
        {data.questions.map((q) => (
          <View key={q.number} style={{ marginBottom: 8 }}>
            <Text style={pdfStyles.body}>
              {q.number}. {q.prompt}
            </Text>
            {q.options && q.options.length > 0 && (
              <View style={{ marginLeft: 14 }}>
                {q.options.map((opt, i) => (
                  <Text key={i} style={pdfStyles.muted}>
                    {LETTERS[i] ?? i + 1}) {opt}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
        <Text style={pdfStyles.subheading}>Answer key</Text>
        {data.questions.map((q) => (
          <Text key={`a-${q.number}`} style={pdfStyles.muted}>
            {q.number}. {q.answer}
          </Text>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/QuestionSetPdf.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/pdf/QuestionSetPdf.tsx components/artifacts/pdf/QuestionSetPdf.test.tsx
git commit -m "Add QuestionSetPdf twin"
```

---

### Task 13: OutlinePdf twin

**Files:**
- Create: `components/artifacts/pdf/OutlinePdf.tsx`
- Test: `components/artifacts/pdf/OutlinePdf.test.tsx`

**Interfaces:**
- Consumes: `pdfStyles` (Task 11), `outlineSchema` from
  `@/lib/artifacts/schema`.
- Produces: `OutlinePdf({ data: z.infer<typeof outlineSchema> })` —
  consumed by `buildPdfDocument` (Task 18).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { OutlinePdf } from "./OutlinePdf";

describe("OutlinePdf", () => {
  it("builds a PDF from a typical outline without throwing", async () => {
    await expect(
      pdf(
        <OutlinePdf
          data={{
            title: "Fractions Lesson",
            sections: [
              { heading: "Warm-up", timeEstimate: "5 min", bullets: ["Review prior work"] },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF when timeEstimate is omitted", async () => {
    await expect(
      pdf(
        <OutlinePdf
          data={{ title: "Fractions Lesson", sections: [{ heading: "Warm-up", bullets: ["Review"] }] }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/OutlinePdf.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { outlineSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type OutlineData = z.infer<typeof outlineSchema>;

export function OutlinePdf({ data }: { data: OutlineData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.sections.map((s, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={pdfStyles.subheading}>
              {s.heading}
              {s.timeEstimate ? `  (${s.timeEstimate})` : ""}
            </Text>
            {s.bullets.map((b, j) => (
              <Text key={j} style={pdfStyles.muted}>
                • {b}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/OutlinePdf.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/pdf/OutlinePdf.tsx components/artifacts/pdf/OutlinePdf.test.tsx
git commit -m "Add OutlinePdf twin"
```

---

### Task 14: RubricPdf twin

**Files:**
- Create: `components/artifacts/pdf/RubricPdf.tsx`
- Test: `components/artifacts/pdf/RubricPdf.test.tsx`

**Interfaces:**
- Consumes: `pdfStyles` (Task 11), `rubricSchema` from
  `@/lib/artifacts/schema`.
- Produces: `RubricPdf({ data: z.infer<typeof rubricSchema> })` —
  consumed by `buildPdfDocument` (Task 18).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { RubricPdf } from "./RubricPdf";

describe("RubricPdf", () => {
  it("builds a PDF from a typical rubric without throwing", async () => {
    await expect(
      pdf(
        <RubricPdf
          data={{
            title: "Essay Rubric",
            criteria: [
              {
                name: "Argument",
                levels: [{ label: "Strong", description: "Clear thesis throughout." }],
              },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/RubricPdf.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { rubricSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type RubricData = z.infer<typeof rubricSchema>;

export function RubricPdf({ data }: { data: RubricData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.criteria.map((c, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={pdfStyles.subheading}>{c.name}</Text>
            {c.levels.map((lvl, j) => (
              <Text key={j} style={pdfStyles.body}>
                {lvl.label}: {lvl.description}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/RubricPdf.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/pdf/RubricPdf.tsx components/artifacts/pdf/RubricPdf.test.tsx
git commit -m "Add RubricPdf twin"
```

---

### Task 15: ChecklistPdf twin

**Files:**
- Create: `components/artifacts/pdf/ChecklistPdf.tsx`
- Test: `components/artifacts/pdf/ChecklistPdf.test.tsx`

**Interfaces:**
- Consumes: `pdfStyles` (Task 11), `checklistSchema` from
  `@/lib/artifacts/schema`.
- Produces: `ChecklistPdf({ data: z.infer<typeof checklistSchema> })` —
  consumed by `buildPdfDocument` (Task 18).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { ChecklistPdf } from "./ChecklistPdf";

describe("ChecklistPdf", () => {
  it("builds a PDF from a typical checklist without throwing", async () => {
    await expect(
      pdf(
        <ChecklistPdf
          data={{
            title: "De-identify Checklist",
            items: [
              { text: "Remove student names", note: "including in filenames" },
              { text: "Blur faces in photos" },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/ChecklistPdf.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { checklistSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type ChecklistData = z.infer<typeof checklistSchema>;

export function ChecklistPdf({ data }: { data: ChecklistData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.items.map((item, i) => (
          <View key={i} style={pdfStyles.row}>
            <Text style={pdfStyles.body}>
              ☐ {item.text}
              {item.note ? ` — ${item.note}` : ""}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/ChecklistPdf.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/pdf/ChecklistPdf.tsx components/artifacts/pdf/ChecklistPdf.test.tsx
git commit -m "Add ChecklistPdf twin"
```

---

### Task 16: LetterPdf twin

**Files:**
- Create: `components/artifacts/pdf/LetterPdf.tsx`
- Test: `components/artifacts/pdf/LetterPdf.test.tsx`

**Interfaces:**
- Consumes: `pdfStyles` (Task 11), `letterSchema` from
  `@/lib/artifacts/schema`.
- Produces: `LetterPdf({ data: z.infer<typeof letterSchema> })` —
  consumed by `buildPdfDocument` (Task 18).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { LetterPdf } from "./LetterPdf";

describe("LetterPdf", () => {
  it("builds a PDF from a typical letter without throwing", async () => {
    await expect(
      pdf(
        <LetterPdf
          data={{
            title: "Parent Email",
            greeting: "Dear families,",
            paragraphs: ["We have a field trip next week."],
            signOff: "Warmly, Ms. Rao",
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });

  it("builds a PDF when greeting and signOff are omitted", async () => {
    await expect(
      pdf(<LetterPdf data={{ title: "Notice", paragraphs: ["School closes early Friday."] }} />).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/LetterPdf.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { Document, Page, Text } from "@react-pdf/renderer";
import type { z } from "zod";
import type { letterSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type LetterData = z.infer<typeof letterSchema>;

export function LetterPdf({ data }: { data: LetterData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        {data.greeting && <Text style={pdfStyles.body}>{data.greeting}</Text>}
        {data.paragraphs.map((p, i) => (
          <Text key={i} style={{ ...pdfStyles.body, marginBottom: 8 }}>
            {p}
          </Text>
        ))}
        {data.signOff && <Text style={pdfStyles.body}>{data.signOff}</Text>}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/LetterPdf.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/pdf/LetterPdf.tsx components/artifacts/pdf/LetterPdf.test.tsx
git commit -m "Add LetterPdf twin"
```

---

### Task 17: FeedbackListPdf twin

**Files:**
- Create: `components/artifacts/pdf/FeedbackListPdf.tsx`
- Test: `components/artifacts/pdf/FeedbackListPdf.test.tsx`

**Interfaces:**
- Consumes: `pdfStyles` (Task 11), `feedbackListSchema` from
  `@/lib/artifacts/schema`.
- Produces: `FeedbackListPdf({ data: z.infer<typeof feedbackListSchema> })`
  — consumed by `buildPdfDocument` (Task 18).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { FeedbackListPdf } from "./FeedbackListPdf";

describe("FeedbackListPdf", () => {
  it("builds a PDF from a typical feedback list without throwing", async () => {
    await expect(
      pdf(
        <FeedbackListPdf
          data={{
            title: "Comment Bank",
            items: [
              { label: "Strength", comment: "Clear topic sentences." },
              { comment: "Consider adding a conclusion." },
            ],
          }}
        />,
      ).toBuffer(),
    ).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/FeedbackListPdf.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { z } from "zod";
import type { feedbackListSchema } from "@/lib/artifacts/schema";
import { pdfStyles } from "./pdfStyles";

type FeedbackListData = z.infer<typeof feedbackListSchema>;

export function FeedbackListPdf({ data }: { data: FeedbackListData }) {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{data.title}</Text>
        {data.items.map((item, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={pdfStyles.body}>
              {item.label ? `${item.label}: ` : ""}
              {item.comment}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/FeedbackListPdf.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/pdf/FeedbackListPdf.tsx components/artifacts/pdf/FeedbackListPdf.test.tsx
git commit -m "Add FeedbackListPdf twin"
```

---

### Task 18: buildPdfDocument dispatcher

**Files:**
- Create: `components/artifacts/pdf/buildPdfDocument.tsx`
- Test: `components/artifacts/pdf/buildPdfDocument.test.tsx`

**Interfaces:**
- Consumes: all 6 PDF twins (Tasks 12-17) + `GenericPdf` (Task 11), all 6
  schemas + `ArchetypeId` from `@/lib/artifacts/schema`.
- Produces:
  `buildPdfDocument({ templateType?: string | null; structured?: Record<string, unknown> | null; output: string }): JSX.Element`
  — consumed by `DownloadPdfButton` (Task 19). Mirrors
  `ArtifactRenderer`'s dispatch logic exactly (Task 9), for PDFs.

This test does not call `pdf(...).toBuffer()` — it only checks which
component `buildPdfDocument` picked, so it runs fine under the default
`jsdom` environment (no `// @vitest-environment node` needed).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { buildPdfDocument } from "./buildPdfDocument";
import { QuestionSetPdf } from "./QuestionSetPdf";
import { GenericPdf } from "./GenericPdf";

describe("buildPdfDocument", () => {
  it("dispatches to the matching PDF twin when templateType and structured are present", () => {
    const structured = { title: "Quiz", questions: [{ number: 1, prompt: "1+1?", answer: "2" }] };
    const element = buildPdfDocument({ templateType: "questionSet", structured, output: "..." });
    expect(element.type).toBe(QuestionSetPdf);
    expect(element.props.data).toBe(structured);
  });

  it("falls back to GenericPdf when structured is missing", () => {
    const element = buildPdfDocument({ templateType: null, structured: null, output: "Plain text" });
    expect(element.type).toBe(GenericPdf);
    expect(element.props.output).toBe("Plain text");
  });

  it("falls back to GenericPdf when templateType is unrecognized", () => {
    const element = buildPdfDocument({
      templateType: "mystery",
      structured: { foo: "bar" },
      output: "Plain text",
    });
    expect(element.type).toBe(GenericPdf);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/pdf/buildPdfDocument.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
import type { z } from "zod";
import type { ReactElement } from "react";
import {
  type ArchetypeId,
  questionSetSchema,
  outlineSchema,
  rubricSchema,
  checklistSchema,
  letterSchema,
  feedbackListSchema,
} from "@/lib/artifacts/schema";
import { GenericPdf } from "./GenericPdf";
import { QuestionSetPdf } from "./QuestionSetPdf";
import { OutlinePdf } from "./OutlinePdf";
import { RubricPdf } from "./RubricPdf";
import { ChecklistPdf } from "./ChecklistPdf";
import { LetterPdf } from "./LetterPdf";
import { FeedbackListPdf } from "./FeedbackListPdf";

export function buildPdfDocument({
  templateType,
  structured,
  output,
}: {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}): ReactElement {
  if (structured) {
    switch (templateType as ArchetypeId | null | undefined) {
      case "questionSet":
        return <QuestionSetPdf data={structured as z.infer<typeof questionSetSchema>} />;
      case "outline":
        return <OutlinePdf data={structured as z.infer<typeof outlineSchema>} />;
      case "rubric":
        return <RubricPdf data={structured as z.infer<typeof rubricSchema>} />;
      case "checklist":
        return <ChecklistPdf data={structured as z.infer<typeof checklistSchema>} />;
      case "letter":
        return <LetterPdf data={structured as z.infer<typeof letterSchema>} />;
      case "feedbackList":
        return <FeedbackListPdf data={structured as z.infer<typeof feedbackListSchema>} />;
    }
  }
  return <GenericPdf output={output} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/pdf/buildPdfDocument.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/pdf/buildPdfDocument.tsx components/artifacts/pdf/buildPdfDocument.test.tsx
git commit -m "Add buildPdfDocument dispatcher for PDF twins"
```

---

### Task 19: DownloadPdfButton

**Files:**
- Create: `components/artifacts/DownloadPdfButton.tsx`
- Test: `components/artifacts/DownloadPdfButton.test.tsx`

**Interfaces:**
- Consumes: `buildPdfDocument` (Task 18, dynamically imported),
  `@react-pdf/renderer`'s `pdf` (dynamically imported).
- Produces:
  `DownloadPdfButton({ templateType?: string | null; structured?: Record<string, unknown> | null; output: string })`
  — consumed by `Playground.tsx` (Task 20) and `ArtifactCard.tsx` (Task 21).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DownloadPdfButton } from "./DownloadPdfButton";

const toBlob = vi.fn();

vi.mock("@react-pdf/renderer", () => ({
  pdf: () => ({ toBlob: () => toBlob() }),
  Document: ({ children }: { children?: unknown }) => children,
  Page: ({ children }: { children?: unknown }) => children,
  Text: ({ children }: { children?: unknown }) => children,
  View: ({ children }: { children?: unknown }) => children,
  StyleSheet: { create: (styles: unknown) => styles },
}));

beforeEach(() => {
  vi.clearAllMocks();
  toBlob.mockResolvedValue(new Blob(["fake pdf"]));
  global.URL.createObjectURL = vi.fn(() => "blob:fake");
  global.URL.revokeObjectURL = vi.fn();
});

describe("DownloadPdfButton", () => {
  it("triggers a blob download when clicked", async () => {
    render(<DownloadPdfButton templateType={null} structured={null} output="Plain text" />);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() => expect(toBlob).toHaveBeenCalled());
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("shows an inline error when PDF generation fails", async () => {
    toBlob.mockRejectedValue(new Error("boom"));
    render(<DownloadPdfButton templateType={null} structured={null} output="Plain text" />);
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    await waitFor(() =>
      expect(screen.getByText("Couldn't create the PDF — try again.")).toBeInTheDocument(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/artifacts/DownloadPdfButton.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
"use client";

import { useState } from "react";

export function DownloadPdfButton({
  templateType,
  structured,
  output,
}: {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setBusy(true);
    setError(false);
    try {
      const [{ pdf }, { buildPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./pdf/buildPdfDocument"),
      ]);
      const blob = await pdf(
        buildPdfDocument({ templateType, structured, output }),
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "artifact.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={download}
        disabled={busy}
        className="text-[13px] font-extrabold text-brand-ink underline underline-offset-2 disabled:opacity-50"
      >
        {busy ? "Preparing PDF…" : "Download PDF"}
      </button>
      {error && <p className="text-[12px] text-coral">Couldn&apos;t create the PDF — try again.</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/artifacts/DownloadPdfButton.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/artifacts/DownloadPdfButton.tsx components/artifacts/DownloadPdfButton.test.tsx
git commit -m "Add DownloadPdfButton with client-side PDF generation"
```

---

### Task 20: Wire DownloadPdfButton into Playground

**Files:**
- Modify: `components/playground/Playground.tsx`

**Interfaces:**
- Consumes: `DownloadPdfButton` (Task 19). Uses the existing `output`,
  `templateType`, `structured` state already present in this file (added
  in Plan 1) — no new state.

- [ ] **Step 1: Write the failing test**

Add this test to `components/playground/Playground.test.tsx`. It reuses
the file's existing module-level `requestGenerate` mock (already declared
via `vi.mock("@/lib/ai/client", ...)` near the top of that file) and
follows the same `requestGenerate.mockResolvedValue({ text: "..." })`
pattern the file's other tests already use (e.g. its
`"renders the result..."` test) — `templateType`/`structured` are
optional on the resolved value, so omitting them is correct and matches
existing precedent:

```tsx
  it("shows a Download PDF button once a result exists", async () => {
    requestGenerate.mockResolvedValue({ text: "Here's your worksheet." });
    render(<Playground scaffold="Make a worksheet" />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument(),
    );
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/playground/Playground.test.tsx`
Expected: FAIL — no "Download PDF" button exists yet.

- [ ] **Step 3: Write minimal implementation**

Add the import:

```tsx
import { DownloadPdfButton } from "@/components/artifacts/DownloadPdfButton";
```

In the JSX, immediately after the existing `{output && allowSave && (...)}`
"Save to Toolkit" button block, add:

```tsx
      {output && (
        <DownloadPdfButton
          templateType={templateType}
          structured={structured}
          output={output}
        />
      )}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/playground/Playground.test.tsx`
Expected: PASS (all tests, including the new one). Confirm every
pre-existing test in this file still passes unmodified — this file also
carries the cancel/timeout/animated-indicator behavior from an earlier
plan, which this task must not touch.

- [ ] **Step 5: Commit**

```bash
git add components/playground/Playground.tsx components/playground/Playground.test.tsx
git commit -m "Add Download PDF button to Playground"
```

---

### Task 21: Wire DownloadPdfButton into ArtifactCard

**Files:**
- Modify: `components/toolkit/ArtifactCard.tsx`
- Modify: `components/toolkit/ArtifactCard.test.tsx`

**Interfaces:**
- Consumes: `DownloadPdfButton` (Task 19). Uses the existing
  `templateType`, `structured`, `output` props already present on this
  component (added in Plan 1) — no new props.

- [ ] **Step 1: Write the failing test**

Add this test to the existing `describe("ArtifactCard rendering", ...)`
block in `components/toolkit/ArtifactCard.test.tsx`:

```tsx
  it("shows a Download PDF button in the expanded view", () => {
    render(
      <ArtifactCard
        id="a1"
        title="Worksheet · Fractions"
        output="Here is your worksheet."
        createdAt="2026-08-20T10:00:00.000Z"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/toolkit/ArtifactCard.test.tsx`
Expected: FAIL — no "Download PDF" button exists yet.

- [ ] **Step 3: Write minimal implementation**

Add the import:

```tsx
import { DownloadPdfButton } from "@/components/artifacts/DownloadPdfButton";
```

In the expanded-view JSX, inside the `<div className="mt-3 flex items-center gap-4 ...">` row's non-`confirmingDelete` branch, add `DownloadPdfButton` alongside Copy/Delete:

```tsx
              <>
                <button
                  onClick={copy}
                  className="text-brand-ink underline underline-offset-2"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
                <DownloadPdfButton
                  templateType={templateType}
                  structured={structured}
                  output={output}
                />
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="text-coral underline underline-offset-2"
                >
                  Delete
                </button>
              </>
```

(This replaces just the two-button fragment already there — the
`confirmingDelete` branch above it is untouched.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/toolkit/ArtifactCard.test.tsx`
Expected: PASS (all tests, including the new one). Confirm every
pre-existing test — especially the full delete-confirmation flow
(Sure?/Yes/No) — still passes unmodified.

- [ ] **Step 5: Commit**

```bash
git add components/toolkit/ArtifactCard.tsx components/toolkit/ArtifactCard.test.tsx
git commit -m "Add Download PDF button to ArtifactCard"
```

---

## Final verification (after all 21 tasks)

- [ ] Run the full suite: `npx vitest run` — expect all tests passing
  (pre-Plan-2 baseline was 241; this plan adds tests in Tasks 1-21).
- [ ] `npx tsc --noEmit` — clean.
- [ ] `npm run lint` — clean (same pre-existing warning count as baseline).
- [ ] Manually verify in a browser against the dev server: generate a
  "Quiz" in Studio (or a lesson with a `questionSet`-mapped
  `artifactType`), confirm the on-screen result shows the real QuestionSet
  layout (not raw text), confirm "Show answer key" toggles correctly,
  confirm "Download PDF" produces a readable PDF, and confirm a
  pre-existing Toolkit item created before this plan still renders via
  Generic with no errors.
