# Artifact Templates — Plan 2: Per-Archetype Rendering + PDF Export

## Goal

Replace the temporary Generic/flattened-text fallback with a real,
elegant, purpose-built visual template for each of the 6 document
archetypes established in Plan 1 (`questionSet`, `outline`, `rubric`,
`checklist`, `letter`, `feedbackList`), and let teachers download any
artifact as a PDF that looks like that template — completing the original
ask from the Plan 1 spec (`docs/superpowers/specs/2026-08-26-artifact-templates-design.md`).

## Scope

**In scope:**
- 6 on-screen template components + a `Generic` fallback (already exists),
  dispatched by `ArtifactRenderer` based on `templateType`.
- Per-archetype plain-text formatting for `output` (Copy-to-clipboard, the
  lesson `verify` block, and `refine` mode's context-prepend) — replacing
  Plan 1's generic `flattenStructuredToText` for artifacts with a known
  archetype (that function remains only as the defensive fallback for a
  `structured` payload that somehow doesn't match its own archetype).
- PDF export: one PDF twin per archetype + `Generic`, a `DownloadPdfButton`
  in both Playground and Toolkit (ArtifactCard).

**Out of scope (unchanged from Plan 1's split):**
- Studio Playground's own artifact-type auto-detection (no `artifactType`
  is known ahead of generation there) — Playground continues to render
  `Generic` for its own freeform results, same as today.
- Any change to which `artifactType` labels map to which archetype
  (`lib/artifacts/mapping.ts` is unchanged).
- Interactive/persisted state on any template (e.g. checking off checklist
  items) — every template is a pure, stateless display of its `structured`
  data. (Confirmed with the user: checklist stays static display, not
  tappable — keeps every template equally simple and avoids new local
  state/test surface for one archetype only.)

## Architecture

### Dispatch

`ArtifactRenderer` (`components/artifacts/ArtifactRenderer.tsx`) currently
always renders `Generic`, ignoring `templateType`. It becomes a real
dispatcher:

```
templateType === "questionSet" && structured  → QuestionSet
templateType === "outline"     && structured  → Outline
templateType === "rubric"      && structured  → Rubric
templateType === "checklist"   && structured  → Checklist
templateType === "letter"      && structured  → Letter
templateType === "feedbackList"&& structured  → FeedbackList
anything else (null, unrecognized, or structured missing) → Generic(output)
```

The `structured missing` fallback branch is what keeps every pre-Plan-1
row (where `template_type`/`structured` are both `null`) and every
Playground-freeform result rendering exactly as they do today. No data
migration, no backfill.

### Shared on-screen primitives

`components/artifacts/templates/primitives.tsx` — three small, reusable
pieces used by more than one template, kept deliberately minimal (YAGNI —
no shared primitive is added speculatively; each is added because at least
two templates below use it):

- `ArtifactHeading({ children })` — the title heading style shared by all 6.
- `Pill({ children })` — small rounded badge (used by Outline's time
  estimate).
- `ListRow({ icon, children })` — an icon/badge + content row (used by
  QuestionSet's questions, Checklist's items, FeedbackList's items).

### On-screen templates (`components/artifacts/templates/`)

Each takes only its own archetype's typed `structured` shape (from
`lib/artifacts/schema.ts`) — no template reads `output` except `Generic`.

**`QuestionSet.tsx`** — props: `questionSetSchema`'s inferred type.
`ArtifactHeading` for `title`; if `instructions` present, a muted italic
line beneath it. Each question renders via `ListRow` with a numbered badge
+ `prompt`; if `options` present, render as lettered choices (A, B, C…) in
a light list beneath the prompt. A "Show answer key" toggle button at the
bottom (local `useState<boolean>`, collapsed by default) reveals all
answers together in a simple list when clicked — never rendered before the
toggle, so a teacher can display/print the sheet student-safe by default.

**`Outline.tsx`** — props: `outlineSchema`'s inferred type. `ArtifactHeading`
for `title`. Each section is a `ListRow`-less light block: bold `heading`,
an inline `Pill` showing `timeEstimate` when present, then `bullets`
rendered as a plain bulleted list beneath.

**`Rubric.tsx`** — props: `rubricSchema`'s inferred type. `ArtifactHeading`
for `title`. Each `criteria` entry is its own block: criterion `name` as a
subheading, then each of its `levels` as a row — level `label` in bold
followed by `description` — stacked vertically (not a horizontal
grid/table, to match this app's single-column card rhythm rather than
introduce horizontal scrolling on narrow screens).

**`Checklist.tsx`** — props: `checklistSchema`'s inferred type.
`ArtifactHeading` for `title`. Each item renders via `ListRow` with a
static check-square icon (never interactive — see Scope), `text`, and an
optional `note` in muted text alongside it.

**`Letter.tsx`** — props: `letterSchema`'s inferred type. Rendered like an
actual letter: `greeting` (if present) in `--font-display`, each
`paragraphs` entry as a normal prose block, `signOff` (if present) in
`--font-display` at the end. No `ArtifactHeading` — a letter doesn't need
a title label the way a worksheet does; `title` is used only for the
Toolkit card's own title (already handled by existing `artifactTitle()`
logic, unchanged).

**`FeedbackList.tsx`** — props: `feedbackListSchema`'s inferred type.
`ArtifactHeading` for `title`. Each item renders via `ListRow`: optional
`label` as a small bold tag, followed by `comment` text.

All six use only existing design tokens — `--font-display` (headings,
letter greeting/sign-off), `--font-sans` (body), `--line`/`--surface`/
`--muted`/`--faint` (borders, backgrounds, secondary text) — no new colors
or spacing scale.

### Per-archetype text formatting

`lib/artifacts/formatArchetypeText.ts` — one function per archetype,
producing plain, readable text (used for `output`, and therefore for
Copy-to-clipboard, the lesson `verify` block, and `refine` mode's
context-prepend):

- `formatQuestionSet(data)` → e.g. `"Q1: 1+1?\n  A) 1\n  B) 2\nAnswer: 2"`
  per question, joined with blank lines; instructions line first if present.
- `formatOutline(data)` → heading + time estimate on one line, bullets
  indented beneath, per section.
- `formatRubric(data)` → criterion name, then `"  <level label>: <description>"`
  per level.
- `formatChecklist(data)` → `"[ ] <text> — <note>"` per item (note omitted
  when absent).
- `formatLetter(data)` → greeting, blank line, paragraphs joined by blank
  lines, blank line, sign-off.
- `formatFeedbackList(data)` → `"<label>: <comment>"` per item (label
  omitted when absent).

`lib/ai/handler.ts`'s success branch calls
`ARCHETYPE_TEXT_FORMATTERS[archetype](structured)` instead of Plan 1's
`flattenStructuredToText` when an archetype is known. `flattenStructuredToText`
(`lib/artifacts/flatten.ts`) is kept as-is and used only as the defensive
fallback inside `extractAndValidate`'s caller if a formatter ever throws
on a schema-valid-but-unexpected shape (wrapped in try/catch, falls back
to the generic flatten rather than crashing generation) — this should not
happen in practice since Zod already validated the shape, but costs
nothing to guard.

### PDF export

One PDF "twin" per archetype plus `Generic`, in `components/artifacts/pdf/`:
`QuestionSetPdf.tsx`, `OutlinePdf.tsx`, `RubricPdf.tsx`, `ChecklistPdf.tsx`,
`LetterPdf.tsx`, `FeedbackListPdf.tsx`, `GenericPdf.tsx`. Built from
`@react-pdf/renderer`'s own primitives (`Document`/`Page`/`View`/`Text`/
`StyleSheet`) — it has its own layout engine, not HTML/Tailwind, so these
cannot reuse the on-screen React components. Each PDF twin mirrors its
on-screen counterpart's section order and content, styled via a shared
`components/artifacts/pdf/pdfStyles.ts` (font sizes, spacing, one accent
color derived from the existing design tokens) so the family of PDFs feels
visually related even though the code can't be shared with the on-screen
templates.

**Generation**: client-side only, on demand, nothing stored server-side. A
new `DownloadPdfButton` (`components/artifacts/DownloadPdfButton.tsx`)
takes `{ templateType, structured, output }`: dynamically imports
`@react-pdf/renderer` (keeps its ~1MB+ footprint out of the main bundle),
picks the matching PDF twin using the same dispatch logic as
`ArtifactRenderer` (falls back to `GenericPdf` built from `output` text),
calls `pdf(<Twin/>).toBlob()`, and triggers a browser download via a
temporary object URL.

**Placement**: the button appears in **Playground** (next to "Save to
Toolkit", once a result exists) and in **ArtifactCard**'s expanded Toolkit
view (next to Copy/Delete) — both locations, per the original Plan 1
brainstorm's answer.

**New dependency**: `@react-pdf/renderer` — not currently installed. This
is the one place in this entire feature area where a new dependency is
justified: no existing library in the repo does PDF document layout.

### Error handling

PDF generation is wrapped in try/catch inside `DownloadPdfButton`; on
failure (e.g. a browser blocking the blob download, or the dynamic import
failing) it shows a brief inline error ("Couldn't create the PDF — try
again") rather than throwing, matching the existing inline-error pattern
used for AI generation failures elsewhere in the app. On-screen templates
never throw on missing optional fields: every optional field (per its Zod
schema) has a safe default/omission (e.g. `Outline`'s `Pill` simply isn't
rendered when `timeEstimate` is absent). Required fields are guaranteed
non-empty by each schema's `.min(1)`, so no template needs an
empty-state branch for its primary content.

## Data model

No new columns. `template_type`/`structured` (added in Plan 1) are
sufficient — Plan 2 only changes how they're rendered and how `output` is
derived from them, not the schema.

## File touch list

**New:**
- `components/artifacts/templates/primitives.tsx` (+ test)
- `components/artifacts/templates/QuestionSet.tsx` (+ test)
- `components/artifacts/templates/Outline.tsx` (+ test)
- `components/artifacts/templates/Rubric.tsx` (+ test)
- `components/artifacts/templates/Checklist.tsx` (+ test)
- `components/artifacts/templates/Letter.tsx` (+ test)
- `components/artifacts/templates/FeedbackList.tsx` (+ test)
- `lib/artifacts/formatArchetypeText.ts` (+ test)
- `components/artifacts/pdf/pdfStyles.ts`
- `components/artifacts/pdf/QuestionSetPdf.tsx` (+ smoke test)
- `components/artifacts/pdf/OutlinePdf.tsx` (+ smoke test)
- `components/artifacts/pdf/RubricPdf.tsx` (+ smoke test)
- `components/artifacts/pdf/ChecklistPdf.tsx` (+ smoke test)
- `components/artifacts/pdf/LetterPdf.tsx` (+ smoke test)
- `components/artifacts/pdf/FeedbackListPdf.tsx` (+ smoke test)
- `components/artifacts/pdf/GenericPdf.tsx` (+ smoke test)
- `components/artifacts/DownloadPdfButton.tsx` (+ test)

**Modified:**
- `components/artifacts/ArtifactRenderer.tsx` — real dispatch (currently
  always renders `Generic`); `ArtifactRenderer.test.tsx` gains one case
  per archetype + the existing fallback cases.
- `lib/ai/handler.ts` — success branch uses
  `ARCHETYPE_TEXT_FORMATTERS[archetype](structured)` instead of
  `flattenStructuredToText`; `lib/ai/handler.test.ts` gains cases
  confirming archetype-specific `text` output (e.g. quiz text contains
  `"Q1:"`, not the generic `flattenStructuredToText` shape).
- `components/playground/Playground.tsx` — adds `DownloadPdfButton` next
  to "Save to Toolkit".
- `components/toolkit/ArtifactCard.tsx` — adds `DownloadPdfButton` next to
  Copy/Delete in the expanded view.
- `package.json` — adds `@react-pdf/renderer`.

## Testing strategy

- **On-screen templates**: one test file per template, rendering a
  known-good sample of its archetype's shape and asserting key
  text/structure appears (e.g. `QuestionSet.test.tsx` asserts the answer
  key is hidden until the toggle is clicked; `Outline.test.tsx` asserts
  the time-estimate pill is absent when `timeEstimate` is omitted).
- **Text formatters**: one test per archetype in
  `formatArchetypeText.test.ts`, asserting the exact expected text shape
  from a sample input.
- **Dispatch**: `ArtifactRenderer.test.tsx` gains one case per archetype
  (correct template rendered) plus the existing Generic-fallback cases
  (null `templateType`, unrecognized value, `structured` missing) —
  unchanged behavior, now covering more branches.
- **PDF**: one smoke test per twin — build the react-pdf element tree from
  a known-good sample and from an edge-case sample (all optional fields
  omitted) and assert it doesn't throw. `DownloadPdfButton.test.tsx` mocks
  the dynamic `@react-pdf/renderer` import and asserts the
  download-trigger path fires on click and the inline error shows on a
  rejected promise.
- **Regression**: every existing test for `Generic`, `ArtifactRenderer`,
  `Playground`, `ArtifactCard`, and `handler.ts` must keep passing —
  changed only where this plan adds new fallback/dispatch cases, never
  weakened or deleted. `handler.test.ts`'s Plan-1 assertion that
  `text` excludes `{`/`}`/`"` for a successful quiz generation still holds
  (the new per-archetype formatter also produces JSON-syntax-free text).

## Global constraints

- TDD required for every behavior change (test first, watch it fail,
  minimal code, watch it pass).
- No `dangerouslySetInnerHTML` anywhere.
- Reuse existing design tokens only for on-screen templates; PDF styles
  may hardcode point-based sizes (react-pdf doesn't consume CSS custom
  properties) but must derive its accent color from the same value the
  tokens use, not an arbitrary new color.
- `@react-pdf/renderer` is the only new dependency this plan introduces.
- Every new pure-logic file gets a co-located test.
- Must not regress: the cancel/timeout/animated-indicator behavior, the
  Toolkit delete flow, or Plan 1's dispatch fallback for pre-existing rows
  and Playground-freeform results.
