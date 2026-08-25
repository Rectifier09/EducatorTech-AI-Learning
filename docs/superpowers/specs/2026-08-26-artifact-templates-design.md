# Artifact-type templates, PDF export, and Toolkit delete — design

> Status: approved by user via brainstorming session, 2026-08-26. Toolkit delete
> shipped separately and is already merged — this spec covers the remaining
> two sub-projects: the artifact-type template system and PDF export.

## Why

AI-generated content (worksheets, quizzes, lesson plans, letters, etc.) is
currently displayed as a raw text dump — literal `**bold**` and `### heading`
markdown syntax shown as-is, no structure, no way to get a clean printable
copy. This makes results feel unfinished and less useful to teachers than
they should be. This spec defines a small, elegant set of type-aware
templates, how a response gets matched to one, and how a teacher downloads
a real PDF that looks like the on-screen result.

## Scope

**In scope:** the *lesson flow* — `PlaygroundBlockView`'s "make"/"refine"
Playground blocks, where the user picks an `artifactType` label (e.g.
"Quiz", "Parent email") from a curated list *before* generating. The type is
known ahead of time; this spec makes the result actually look like that
type.

**Out of scope (explicit, deferred):** real content-based type *detection*
for the freeform Studio Playground (`/create`), which has no pre-selected
type. Freeform prompts still render through the **Generic** template below —
which already fixes the raw-markdown-dump problem — but never get a
type-specific layout in this pass.

**Also in scope:** even within the known-type lesson flow, the user can
freely edit the scaffolded prompt before submitting, and the model can drift
off-script. So a pre-selected `artifactType` is a *hint about which schema to
request*, never a guarantee about what comes back — every generation is
validated before a specific template is used, with Generic as the universal,
always-available fallback.

## The archetype set

Six document archetypes cover all ~36 `artifactType` labels used across the
11 tracks. This keeps the "elegant set of templates" small and maintainable
rather than one bespoke template per label.

| Archetype | Shape | Represents |
|---|---|---|
| `questionSet` | title + numbered questions (optional MCQ options) + answers | Quiz, Worksheet, Exit-ticket set, Tiered homework/question bank, Oral-defence prompts, 3-tier worksheet, AI-resilient assignment, Quiz-maker assistant |
| `outline` | title + ordered/timed sections with bullets | Lesson-plan outline, 15-min mini-PD outline, Meeting-notes format, Attendance tracker steps |
| `rubric` | title + criteria rows × performance-level columns | Rubric, Progress-flag rules |
| `checklist` | title + checkbox items | De-identify checklist, My AI-check checklist, Do/Don't starter list, Process checklist, AI ground-rules one-pager, Student AI-use guidelines, Staff AI guidance one-pager |
| `letter` | greeting + body paragraphs + sign-off | Email template, Parent email, Class notice, Notice template, Permission form, Permission-slip template |
| `feedbackList` | title + labeled remarks | Comment bank, Feedback comments, Whole-class feedback summary, Feedback assistant |
| *(fallback, not a real archetype)* `generic` | clean formatted prose (real headings/bold via a light markdown formatter, not literal `**`/`#`) | Activity idea, Custom, Explainer assistant, Gradebook formula set, every Studio Playground result, every validation failure, every artifact saved before this feature shipped |

### Full label → archetype mapping

```
15-min mini-PD outline      -> outline          Meeting-notes format        -> outline
3-tier worksheet            -> questionSet      My AI-check checklist       -> checklist
AI ground-rules one-pager   -> checklist        Notice template             -> letter
AI-resilient assignment     -> questionSet      Oral-defence prompts        -> questionSet
Activity idea                -> generic          Parent email                -> letter
Attendance tracker steps    -> outline          Permission form             -> letter
Class notice                -> letter           Permission-slip template    -> letter
Comment bank                 -> feedbackList     Process checklist           -> checklist
Custom                       -> generic          Progress-flag rules         -> rubric
De-identify checklist       -> checklist        Quiz                        -> questionSet
Do/Don't starter list       -> checklist        Quiz-maker assistant        -> questionSet
Email template               -> letter           Rubric                      -> rubric
Exit-ticket set              -> questionSet      Staff AI guidance one-pager -> checklist
Explainer assistant          -> generic          Student AI-use guidelines   -> checklist
Feedback assistant           -> feedbackList     Tiered homework             -> questionSet
Feedback comments            -> feedbackList     Tiered question bank        -> questionSet
Gradebook formula set        -> generic          Whole-class feedback summary-> feedbackList
Lesson-plan outline          -> outline          Worksheet                   -> questionSet
```

Any label not in this table (future content additions) falls back to
`generic` automatically — the mapping function returns `null`/`generic` for
unknown input rather than throwing.

## Data model

New migration, two nullable columns on `playground_sessions`:

```sql
alter table public.playground_sessions
  add column template_type text,   -- 'questionSet' | 'outline' | 'rubric'
                                    -- | 'checklist' | 'letter' | 'feedbackList'
                                    -- | null (render Generic from `output`)
  add column structured jsonb;     -- schema-validated payload, or null
```

`output` (existing `text not null` column) is unchanged and always
populated — it remains the source for "Copy to clipboard" and is exactly
what Generic renders (through the light markdown formatter) when
`structured` is null. No backfill: every pre-existing row simply has
`template_type = null`, which is the same code path as a fresh validation
failure — one fallback mechanism, no separate "legacy" branch anywhere.

No new RLS policy: the existing `own_playground` policy (`for all`) already
covers these columns like every other column on the row.

## Schemas (`lib/artifacts/schema.ts`)

Zod schemas, one per archetype. `.min(1)` on each primary array does double
duty as both the shape check and the "did the model actually produce
content" check — no separate minimum-content step needed.

```ts
export const questionSetSchema = z.object({
  title: z.string(),
  instructions: z.string().optional(),
  questions: z.array(z.object({
    number: z.number().int().positive(),
    prompt: z.string(),
    options: z.array(z.string()).optional(),
    answer: z.string(),
  })).min(1),
});

export const outlineSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    timeEstimate: z.string().optional(),
    bullets: z.array(z.string()).min(1),
  })).min(1),
});

export const rubricSchema = z.object({
  title: z.string(),
  criteria: z.array(z.object({
    name: z.string(),
    levels: z.array(z.object({
      label: z.string(),        // e.g. "Proficient"
      description: z.string(),
    })).min(2),
  })).min(1),
});

export const checklistSchema = z.object({
  title: z.string(),
  items: z.array(z.object({
    text: z.string(),
    note: z.string().optional(),
  })).min(1),
});

export const letterSchema = z.object({
  title: z.string(),
  greeting: z.string().optional(),
  paragraphs: z.array(z.string()).min(1),
  signOff: z.string().optional(),
});

export const feedbackListSchema = z.object({
  title: z.string(),
  items: z.array(z.object({
    label: z.string().optional(),
    comment: z.string(),
  })).min(1),
});
```

`lib/artifacts/mapping.ts` exports `archetypeForArtifactType(label: string |
null): ArchetypeId | null` — the pure lookup table above, `null` for
Generic/unknown.

## Generation pipeline

**Request contract**: `artifactType` must travel with the generate request,
not just the save-to-toolkit call as today.

```
Playground.tsx (already has artifactType prop)
  -> requestGenerate(userText, mode, signal, artifactType)
  -> POST /api/ai/generate  { userText, mode, artifactType }
  -> handleGenerate({ userText, mode, signal, artifactType })
```

In `handleGenerate`: if `archetypeForArtifactType(artifactType)` resolves to
a real archetype, append a JSON-mode instruction to the system prompt naming
that exact schema — the same technique `guardrails.ts` already uses for
`mode: "grade"`, and the same "respond ONLY with JSON" pattern
`gradePrompt.ts` already uses in production. Applies to both `make` and
`refine` Playground modes (refining a worksheet should still produce a
worksheet). `verify` mode doesn't call the AI and is unaffected.

After `generate()` returns, reuse `gradePrompt.parseGrade`'s exact
technique: extract the `{...}` substring, `JSON.parse`, then
`.safeParse()` against the archetype's schema. Success →
`{ text, templateType, structured }`. Failure (bad JSON, wrong shape, empty
array) → `{ text, templateType: null, structured: null }` — **the raw text
is always still returned**, so nothing is ever lost; worst case is a
Generic-styled card instead of a type-specific one. This is the same
accepted trade-off `gradePrompt.ts` already ships with today, not a new
risk.

Response shape grows from `{ text }` to `{ text, templateType?, structured?
}`. `lib/ai/client.ts`'s `GenerateReply` type and the route handler both
need updating to carry the two new optional fields.

`Playground.tsx`'s `onResult` callback grows from `(text, prompt) => void`
to `(text, prompt, templateType?, structured?) => void`, threaded through to
`saveToToolkit` so the new columns get populated on save.

**No new AI-reliability risk**: this reuses the exact same `generate()` call
(only the prompt content and post-processing differ), so it inherits the
cancel + 20s-timeout + Gemini/Groq-failover behavior already in place —
nothing about that regresses.

## Rendering architecture

- One presentational component per archetype:
  `components/artifacts/templates/{QuestionSet,Outline,Rubric,Checklist,Letter,FeedbackList,Generic}.tsx`.
  Each takes only its own typed `structured` shape (Generic takes raw
  `output` text through a small safe markdown formatter — bold/headings
  actually render, not literal `**`/`#`). All styled with existing design
  tokens (`--gold`, `--surface`, `--ink`, `var(--font-display)`, etc.) — no
  new visual language.
- **`ArtifactRenderer.tsx`** — the single dispatcher: given
  `{ templateType, structured, output }`, picks the matching template, or
  Generic if `templateType` is null/unrecognized. This is the only place
  that knows the full archetype list.
- **Two integration points**, both replacing today's `whitespace-pre-wrap`
  raw-text div: `Playground.tsx`'s own result preview, and
  `ArtifactCard.tsx`'s expanded Toolkit view. `PlaygroundBlockView.tsx`
  already renders its output *through* `<Playground>`, so fixing
  `Playground.tsx` covers every lesson archetype automatically — no
  separate lesson-side rendering path.

## PDF export

- New dependency: `@react-pdf/renderer` (client-capable — renders to a Blob
  in the browser, no server/API route, no new infra cost).
- One PDF "twin" per archetype:
  `components/artifacts/pdf/{QuestionSetPdf,OutlinePdf,RubricPdf,ChecklistPdf,LetterPdf,FeedbackListPdf,GenericPdf}.tsx`,
  built from react-pdf's own primitives (`Document/Page/View/Text/StyleSheet`
  — not HTML/Tailwind, react-pdf has its own layout engine). A shared
  `lib/artifacts/pdfTheme.ts` holds hex colors and registers the Fraunces/
  Mulish font files pulled from the same design tokens, so the PDF echoes
  the on-screen look without being pixel-identical. Generic gets a PDF twin
  too, so "Download PDF" always works, even on unclassified content.
- **`DownloadPdfButton.tsx`** — one reusable client component taking
  `{ templateType, structured, output, title }`. On click, dynamically
  imports `@react-pdf/renderer` and the matching PDF twin (keeps that
  library out of the main page bundle), renders to a Blob, triggers a
  download via an object URL. Filename derives from the slugified title.
  On failure (corrupt payload, dynamic-import network hiccup), shows a small
  inline "Couldn't build the PDF — try again" on the button itself —
  non-blocking, Copy/View still work.
- **Placement**: both `Playground.tsx`'s result view (before/alongside
  saving) and `ArtifactCard.tsx`'s expanded Toolkit view (next to
  Copy/Delete). `ArtifactCard` already computes a `title` prop via
  `artifactTitle()` (existing function, keyed off the saved row's
  `createdAt`) to pass straight through. `Playground.tsx` has no saved row
  yet at this point, so its `title` prop instead falls back to
  `artifactType` itself (e.g. "Quiz") when set, or a generic "Your creation"
  when generating from the untyped Studio Playground.

## Testing

- **Unit**: `archetypeForArtifactType` (table-driven, one case per label
  group); each schema's `safeParse` on valid/invalid samples; the
  generation-layer JSON-extract-validate helper, mocking `generate()` in the
  same style as the existing `gradePrompt.test.ts`.
- **Component**: `ArtifactRenderer` dispatch (known type → right template,
  unknown/null → Generic); one rendering test per template asserting its key
  content appears; a test that Generic's markdown-lite formatter renders
  `**bold**`/`### heading` correctly instead of literal characters.
- **PDF**: a smoke test per archetype's "build the react-pdf tree" function
  (doesn't throw on typical input or edge cases — empty arrays, missing
  optional fields); a `DownloadPdfButton` test mocking the dynamic import and
  asserting a download is triggered (same mocking approach used for
  `Playground.test.tsx`).
- **Manual**: PDF visual fidelity is verified by hand in-browser, same as
  every other UI change in this project — byte-level PDF output isn't
  meaningfully unit-testable.

## Files touched (new)

```
supabase/migrations/0005_artifact_templates.sql
lib/artifacts/schema.ts
lib/artifacts/schema.test.ts
lib/artifacts/mapping.ts
lib/artifacts/mapping.test.ts
lib/artifacts/pdfTheme.ts
components/artifacts/ArtifactRenderer.tsx
components/artifacts/ArtifactRenderer.test.tsx
components/artifacts/templates/{QuestionSet,Outline,Rubric,Checklist,Letter,FeedbackList,Generic}.tsx
components/artifacts/templates/*.test.tsx
components/artifacts/pdf/{QuestionSetPdf,OutlinePdf,RubricPdf,ChecklistPdf,LetterPdf,FeedbackListPdf,GenericPdf}.tsx
components/artifacts/pdf/*.test.tsx
components/artifacts/DownloadPdfButton.tsx
components/artifacts/DownloadPdfButton.test.tsx
```

## Files touched (modified)

```
lib/ai/types.ts            - GenerateInput/response shapes gain templateType/structured
lib/ai/handler.ts          - archetype-aware JSON-mode prompting + parse/validate
lib/ai/handler.test.ts     - new cases
lib/ai/client.ts           - requestGenerate gains artifactType param; GenerateReply grows
lib/ai/guardrails.ts       - archetype JSON-instruction builder (alongside existing "grade" mode)
app/api/ai/generate/route.ts - reads/forwards artifactType
lib/data/toolkit.ts        - saveArtifact persists template_type/structured
lib/data/types.ts          - SavedArtifact/PlaygroundSession gain the two fields
components/playground/Playground.tsx - onResult grows params; renders via ArtifactRenderer;
                                        adds DownloadPdfButton
components/toolkit/ArtifactCard.tsx  - renders via ArtifactRenderer; adds DownloadPdfButton
app/create/page.tsx        - passes new fields through to ArtifactCard
package.json               - + @react-pdf/renderer
```
