# Mixpanel Acquisition/Activation/Retention/Referral Funnel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the pilot a real Acquisition → Activation → Retention → Referral funnel, both in Mixpanel (via a new `acquisition_source` profile property) and in the in-app Admin dashboard (via five new pure functions in `lib/measurement/metrics.ts` and four new dashboard sections).

**Architecture:** Two independent tracks that share one data need. Track A instruments `ai_generate` with `trackId` (currently missing) so "first generate action on Track 1" is computable at all, and tags each new Mixpanel profile with `acquisition_source`. Track B adds five pure, unit-tested functions to `lib/measurement/metrics.ts` (the same file every existing funnel already lives in) and wires their output into four new sections of `app/admin/page.tsx`.

**Tech Stack:** Next.js 15 (App Router, Server Actions), TypeScript, Supabase (Postgres), Mixpanel HTTP APIs (`/track`, `/engage`), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-26-mixpanel-funnel-design.md`

## Global Constraints

- The *existing* Activation funnel (`activationCounts` in `lib/measurement/metrics.ts`) does not change — it has pass/fail targets tied to the pilot spec. The new "Track 1 generate" metric is additive, shown as an extra row.
- Every new `metrics.ts` function is pure (no I/O) — same convention as every function already in that file.
- Analytics calls must never throw and must never block the caller — `setProfileProperties` follows the exact fire-and-forget, try/catch, `console.error`-on-failure shape as the existing `trackServer`.
- `trackId` threading through the generate pipeline is optional at every layer — no existing call site breaks, no existing test's assertions on prior behavior change.
- No changes to Mixpanel's project-level Identity Merge setting or to any Mixpanel Board/Insight configuration — those live in Mixpanel's own UI, out of scope for this plan.
- No reward/incentive logic for referrals — unchanged from the existing referral/share feature's scope.

---

### Task 1: Thread `trackId` through the AI generate pipeline (server side)

**Files:**
- Modify: `lib/ai/client.ts`
- Modify: `app/api/ai/generate/route.ts`
- Modify: `lib/ai/handler.ts`
- Test: `lib/ai/handler.test.ts`

**Interfaces:**
- Consumes: nothing new — `AiMode` from `./guardrails`, `logEvent` from `@/lib/data/events` (both already imported in `handler.ts`).
- Produces:
  - `requestGenerate(userText: string, mode?: AiMode, signal?: AbortSignal, artifactType?: string | null, trackId?: string | null): Promise<GenerateReply>` — new 5th parameter, used by Task 2.
  - `handleGenerate(input: { userText: string; mode: AiMode; signal?: AbortSignal; artifactType?: string | null; trackId?: string | null }): Promise<GenerateResponse>` — new optional `trackId` field.
  - Every `ai_generate` event now always carries a `trackId` key (`string` or `null`) — used by Task 6's `track1Activation`.

`app/api/ai/generate/route.ts` has no dedicated test file in this codebase today (it's a thin JSON pass-through). This task verifies its change via the `handler.test.ts` coverage below plus `tsc --noEmit` — consistent with its current (zero) test coverage.

- [ ] **Step 1: Write the failing tests**

Add to `lib/ai/handler.test.ts`, inside the existing `describe("handleGenerate", ...)` block, after the last `it(...)`:

```ts
  it("includes trackId in the logged ai_generate event when provided", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Here is a worksheet", provider: "gemini" });
    await handleGenerate({
      userText: "Make a worksheet",
      mode: "playground",
      trackId: "ai-foundations",
    });
    expect(logEvent).toHaveBeenCalledWith(
      "ai_generate",
      expect.objectContaining({ trackId: "ai-foundations" }),
    );
  });

  it("logs trackId: null when the caller doesn't provide one", async () => {
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 29 });
    generate.mockResolvedValue({ text: "Here is a worksheet", provider: "gemini" });
    await handleGenerate({ userText: "Make a worksheet", mode: "playground" });
    expect(logEvent).toHaveBeenCalledWith(
      "ai_generate",
      expect.objectContaining({ trackId: null }),
    );
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/ai/handler.test.ts`
Expected: both new tests FAIL — `handleGenerate` doesn't accept or log `trackId` yet.

- [ ] **Step 3: Implement `handleGenerate`'s `trackId` support**

In `lib/ai/handler.ts`, change the function signature and the `logEvent` call:

```ts
export async function handleGenerate({
  userText,
  mode,
  signal,
  artifactType = null,
  trackId = null,
}: {
  userText: string;
  mode: AiMode;
  signal?: AbortSignal;
  artifactType?: string | null;
  trackId?: string | null;
}): Promise<GenerateResponse> {
```

And change the existing `logEvent` call from:

```ts
    await logEvent("ai_generate", { mode, provider: result.provider });
```

to:

```ts
    await logEvent("ai_generate", { mode, provider: result.provider, trackId });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/ai/handler.test.ts`
Expected: PASS (all tests, including the two new ones and every pre-existing one).

- [ ] **Step 5: Thread `trackId` through the client and API route**

In `lib/ai/client.ts`, change `requestGenerate` to:

```ts
export async function requestGenerate(
  userText: string,
  mode: AiMode = "playground",
  signal?: AbortSignal,
  artifactType?: string | null,
  trackId?: string | null,
): Promise<GenerateReply> {
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, mode, artifactType, trackId }),
      signal,
    });
    return (await res.json()) as GenerateReply;
  } catch {
    return { error: "Network hiccup — try again.", code: "network" };
  }
}
```

In `app/api/ai/generate/route.ts`, change the `POST` handler to parse and forward `trackId`:

```ts
import { NextResponse } from "next/server";
import { handleGenerate } from "@/lib/ai/handler";
import type { AiMode } from "@/lib/ai/guardrails";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userText: string = typeof body.userText === "string" ? body.userText : "";
  const mode: AiMode = body.mode ?? "playground";
  const artifactType: string | null =
    typeof body.artifactType === "string" ? body.artifactType : null;
  const trackId: string | null =
    typeof body.trackId === "string" ? body.trackId : null;

  const result = await handleGenerate({
    userText,
    mode,
    signal: request.signal,
    artifactType,
    trackId,
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

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Run the full suite**

Run: `npx vitest run`
Expected: all tests PASS (no regressions).

- [ ] **Step 8: Commit**

```bash
git add lib/ai/client.ts app/api/ai/generate/route.ts lib/ai/handler.ts lib/ai/handler.test.ts
git commit -m "Thread trackId through the AI generate pipeline"
```

---

### Task 2: Thread `trackId` through the Playground UI

**Files:**
- Modify: `components/playground/Playground.tsx`
- Modify: `components/lesson/blocks/PlaygroundBlockView.tsx`
- Test: `components/playground/Playground.test.tsx`

**Interfaces:**
- Consumes: `requestGenerate`'s new 5th parameter from Task 1.
- Produces: `<Playground trackId?: string | null>` prop (default `null`, same style as the existing `lessonId` prop).

`components/lesson/blocks/PlaygroundBlockView.tsx` has no dedicated test file in this codebase (it's a thin composition of `<Playground>`); its one-line change is verified by the `Playground.test.tsx` coverage below (which proves the prop is forwarded correctly) plus `tsc --noEmit`.

- [ ] **Step 1: Write the failing test**

Add to `components/playground/Playground.test.tsx`, inside the existing `describe("Playground", ...)` block, after the `"passes artifactType through to requestGenerate when set"` test:

```ts
  it("passes trackId through to requestGenerate when set", async () => {
    requestGenerate.mockResolvedValue({ text: "Here is a quiz" });
    render(<Playground scaffold="Make a quiz" trackId="ai-foundations" />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));

    await waitFor(() => expect(requestGenerate).toHaveBeenCalled());
    const [, , , , trackId] = requestGenerate.mock.calls[0];
    expect(trackId).toBe("ai-foundations");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/playground/Playground.test.tsx`
Expected: FAIL — `Playground` doesn't accept a `trackId` prop yet, so `requestGenerate` is called with `undefined` in that position.

- [ ] **Step 3: Implement the `trackId` prop**

In `components/playground/Playground.tsx`, add `trackId` to the destructured props and its type, and forward it into `requestGenerate`:

```ts
export function Playground({
  scaffold,
  mode = "playground",
  seedContent,
  context = null,
  onResult,
  allowSave = true,
  artifactType = null,
  lessonId = null,
  trackId = null,
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
    structured?: Record<string, unknown> | null,
  ) => void;
  allowSave?: boolean;
  artifactType?: string | null;
  lessonId?: string | null;
  trackId?: string | null;
}) {
```

And change the `requestGenerate` call inside `run()` from:

```ts
    const r = await requestGenerate(userText, mode, controller.signal, artifactType);
```

to:

```ts
    const r = await requestGenerate(userText, mode, controller.signal, artifactType, trackId);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/playground/Playground.test.tsx`
Expected: PASS (all tests, including the new one).

- [ ] **Step 5: Wire `trackId` from `PlaygroundBlockView`**

In `components/lesson/blocks/PlaygroundBlockView.tsx`, add `trackId={trackId}` to the existing `<Playground>` element (it already receives `trackId` as its own prop, used elsewhere in this file for the `saveToToolkit` call):

```tsx
      <Playground
        scaffold={scaffold}
        context={block.mode === "refine" ? (spineArtifact ?? null) : null}
        mode="playground"
        artifactType={choice || null}
        lessonId={lessonId}
        trackId={trackId}
        allowSave={false}
        onResult={(text, prompt, templateType, structured) => {
```

(Leave the rest of the `onResult` body and closing tags exactly as they are today — only the new `trackId={trackId}` line is added.)

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Run the full suite**

Run: `npx vitest run`
Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add components/playground/Playground.tsx components/lesson/blocks/PlaygroundBlockView.tsx components/playground/Playground.test.tsx
git commit -m "Thread trackId through the Playground UI"
```

---

### Task 3: Add `setProfileProperties` to the Mixpanel server mirror

**Files:**
- Modify: `lib/analytics/mixpanel-server.ts`
- Modify: `lib/analytics/mixpanel-server.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `setProfileProperties(distinctId: string, props: Record<string, unknown>): Promise<void>` — used by Task 4.

- [ ] **Step 1: Write the failing tests**

Change the import line at the top of `lib/analytics/mixpanel-server.test.ts` from:

```ts
import { trackServer } from "./mixpanel-server";
```

to:

```ts
import { trackServer, setProfileProperties } from "./mixpanel-server";
```

Then add this new `describe` block at the end of the file, after the existing `describe("trackServer", ...)` block:

```ts

describe("setProfileProperties", () => {
  it("no-ops without a project token", async () => {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    const fetchSpy = vi.spyOn(global, "fetch");
    await setProfileProperties("u1", { acquisition_source: "organic" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts profile properties to Mixpanel's engage API when configured", async () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "test-token";
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("1"));

    await setProfileProperties("u1", { acquisition_source: "referral" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://api.mixpanel.com/engage");
    const body = JSON.parse(init!.body as string);
    expect(body[0]).toMatchObject({
      $token: "test-token",
      $distinct_id: "u1",
      $set: { acquisition_source: "referral" },
    });
  });

  it("never throws even if the network call fails", async () => {
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = "test-token";
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));

    await expect(
      setProfileProperties("u1", { acquisition_source: "organic" }),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/analytics/mixpanel-server.test.ts`
Expected: FAIL with "setProfileProperties is not a function" (or an import error) — it doesn't exist yet.

- [ ] **Step 3: Implement `setProfileProperties`**

Add this function to `lib/analytics/mixpanel-server.ts`, after the existing `trackServer` function:

```ts

/**
 * Fire-and-forget profile-property mirror to Mixpanel's HTTP Engage API.
 * NEVER throws — analytics must not break the app. No-ops if the project
 * token isn't configured.
 */
export async function setProfileProperties(
  distinctId: string,
  props: Record<string, unknown>,
): Promise<void> {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;

  try {
    await fetch("https://api.mixpanel.com/engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          $token: token,
          $distinct_id: distinctId,
          $set: props,
        },
      ]),
    });
  } catch (e) {
    console.error("setProfileProperties failed:", e);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/analytics/mixpanel-server.test.ts`
Expected: PASS (all 6 tests — 3 existing `trackServer` + 3 new `setProfileProperties`).

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/mixpanel-server.ts lib/analytics/mixpanel-server.test.ts
git commit -m "Add setProfileProperties to the Mixpanel server mirror"
```

---

### Task 4: Tag `acquisition_source` on the Mixpanel profile at onboarding completion

**Files:**
- Modify: `app/actions/onboarding.ts`
- Create: `app/actions/onboarding.test.ts`

**Interfaces:**
- Consumes: `setProfileProperties` from Task 3; `upsertProfile` (already imported in this file) returns the full updated `Profile`, including `referredBy`, which this task reads directly from that return value — no extra `getProfile` call needed.
- Produces: nothing new consumed by a later task — this is the last link in the acquisition-tagging chain.

This is the first test file for `app/actions/onboarding.ts`. Scope the new test file to `completeOnboarding` only — the file's other two exported functions (`saveOnboardingField`, `savePreSurvey`) are untouched by this task and stay untested, consistent with not expanding scope beyond the task.

- [ ] **Step 1: Write the failing tests**

Create `app/actions/onboarding.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionUser = vi.fn();
const upsertProfile = vi.fn();
const logEvent = vi.fn();
const setProfileProperties = vi.fn();

vi.mock("@/lib/auth", () => ({ getSessionUser: () => getSessionUser() }));
vi.mock("@/lib/data/profile", () => ({
  upsertProfile: (id: string, patch: unknown) => upsertProfile(id, patch),
}));
vi.mock("@/lib/data/events", () => ({
  logEvent: (...args: unknown[]) => logEvent(...args),
}));
vi.mock("@/lib/analytics/mixpanel-server", () => ({
  setProfileProperties: (...args: unknown[]) => setProfileProperties(...args),
}));
vi.mock("@/lib/data/survey", () => ({
  validateSurveyInput: vi.fn(),
  insertSurvey: vi.fn(),
}));

import { completeOnboarding } from "./onboarding";

beforeEach(() => {
  vi.clearAllMocks();
  getSessionUser.mockResolvedValue({ id: "u1", email: "e", name: "n" });
});

describe("completeOnboarding", () => {
  it("tags the Mixpanel profile as organic when the user has no referrer", async () => {
    upsertProfile.mockResolvedValue({ referredBy: null });
    await completeOnboarding();
    expect(setProfileProperties).toHaveBeenCalledWith("u1", {
      acquisition_source: "organic",
    });
  });

  it("tags the Mixpanel profile as referral when the user was referred", async () => {
    upsertProfile.mockResolvedValue({ referredBy: "referrer-uuid" });
    await completeOnboarding();
    expect(setProfileProperties).toHaveBeenCalledWith("u1", {
      acquisition_source: "referral",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/actions/onboarding.test.ts`
Expected: FAIL — `setProfileProperties` is never called; `completeOnboarding` doesn't import or use it yet.

- [ ] **Step 3: Implement the wiring**

In `app/actions/onboarding.ts`, add the import:

```ts
import { setProfileProperties } from "@/lib/analytics/mixpanel-server";
```

Change `completeOnboarding` from:

```ts
export async function completeOnboarding(): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await upsertProfile(user.id, {
    onboardedAt: new Date().toISOString(),
    displayName: user.name ?? null,
  });
  await logEvent("onboarding_completed");
}
```

to:

```ts
export async function completeOnboarding(): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  const profile = await upsertProfile(user.id, {
    onboardedAt: new Date().toISOString(),
    displayName: user.name ?? null,
  });
  await logEvent("onboarding_completed");
  await setProfileProperties(user.id, {
    acquisition_source: profile.referredBy ? "referral" : "organic",
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/actions/onboarding.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors; all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/actions/onboarding.ts app/actions/onboarding.test.ts
git commit -m "Tag acquisition_source on the Mixpanel profile at onboarding completion"
```

---

### Task 5: `lib/measurement/metrics.ts` — `ProfileRow.referred_by` + `acquisitionBySource`

**Files:**
- Modify: `lib/measurement/metrics.ts`
- Modify: `lib/measurement/metrics.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `ProfileRow` gains an optional field: `referred_by?: string | null` (existing callers that don't need it, like `activationCounts`'s own tests, are unaffected).
  - `acquisitionBySource(profiles: ProfileRow[]): AcquisitionWeek[]`, where `interface AcquisitionWeek { weekStart: string; organic: number; referred: number }` — used by Task 9.

- [ ] **Step 1: Write the failing test**

Add to `lib/measurement/metrics.test.ts`. First, add `acquisitionBySource` to the existing import block at the top of the file:

```ts
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  journeyFunnel,
  reflectionValueByLesson,
  lessonHealthRanking,
  acquisitionBySource,
} from "./metrics";
```

Then add this test, anywhere inside the top-level `describe("measurement metrics", ...)` block:

```ts
  it("acquisitionBySource buckets onboarded_at into Monday-start weeks, split organic vs referred", () => {
    const weeks = acquisitionBySource([
      { user_id: "a", onboarded_at: "2026-08-24T10:00:00Z", referred_by: null }, // Monday
      { user_id: "b", onboarded_at: "2026-08-26T10:00:00Z", referred_by: "r1" }, // Wednesday, same week
      { user_id: "c", onboarded_at: "2026-08-31T10:00:00Z", referred_by: null }, // next Monday
      { user_id: "d", onboarded_at: null }, // not onboarded — excluded
    ]);
    expect(weeks).toEqual([
      { weekStart: "2026-08-24", organic: 1, referred: 1 },
      { weekStart: "2026-08-31", organic: 1, referred: 0 },
    ]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: FAIL — `acquisitionBySource` doesn't exist yet.

- [ ] **Step 3: Implement `ProfileRow.referred_by` and `acquisitionBySource`**

In `lib/measurement/metrics.ts`, change the `ProfileRow` interface from:

```ts
export interface ProfileRow {
  user_id: string;
  onboarded_at: string | null;
}
```

to:

```ts
export interface ProfileRow {
  user_id: string;
  onboarded_at: string | null;
  /** Optional: only populated by callers that fetched it (Acquisition/Referral
   *  sections). Missing or null both mean "not referred" (organic). */
  referred_by?: string | null;
}
```

Then add this function anywhere after the `ProfileRow`/`EventRow` interfaces (e.g. right after `activationCounts`):

```ts
function mondayOf(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff),
  );
  return monday.toISOString().slice(0, 10);
}

export interface AcquisitionWeek {
  /** Monday of the week, YYYY-MM-DD (UTC). */
  weekStart: string;
  organic: number;
  referred: number;
}

/** New signups per week (Monday-start, UTC), split organic vs. referred. */
export function acquisitionBySource(profiles: ProfileRow[]): AcquisitionWeek[] {
  const byWeek = new Map<string, { organic: number; referred: number }>();
  for (const p of profiles) {
    if (!p.onboarded_at) continue;
    const week = mondayOf(p.onboarded_at);
    const cur = byWeek.get(week) ?? { organic: 0, referred: 0 };
    if (p.referred_by) cur.referred += 1;
    else cur.organic += 1;
    byWeek.set(week, cur);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, counts]) => ({ weekStart, ...counts }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: PASS (all tests, including the new one).

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/measurement/metrics.ts lib/measurement/metrics.test.ts
git commit -m "Add acquisitionBySource to lib/measurement/metrics.ts"
```

---

### Task 6: `lib/measurement/metrics.ts` — `track1Activation`

**Files:**
- Modify: `lib/measurement/metrics.ts`
- Modify: `lib/measurement/metrics.test.ts`

**Interfaces:**
- Consumes: `trackId` on `ai_generate` events, from Task 1. `FOUNDATIONS_TRACK_ID` (already imported in this file from `@/lib/content/loader`).
- Produces:
  - A private (module-scope, not exported) helper `track1ActivatedUserIds(events: EventRow[]): Set<string>` — reused by Task 8's `referralFunnel` in the same file, no import needed.
  - `track1Activation(input: { events: EventRow[]; onboardedCount: number }): Track1Activation`, where `interface Track1Activation { activated: number; activatedPct: number }` — used by Task 9.

- [ ] **Step 1: Write the failing test**

Add `track1Activation` to the import block at the top of `lib/measurement/metrics.test.ts`:

```ts
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  journeyFunnel,
  reflectionValueByLesson,
  lessonHealthRanking,
  acquisitionBySource,
  track1Activation,
} from "./metrics";
```

Then add this test:

```ts
  it("track1Activation counts distinct users with an ai_generate event scoped to Track 1", () => {
    const r = track1Activation({
      events: [
        { user_id: "a", name: "ai_generate", created_at: "now", props: { trackId: "ai-foundations" } },
        { user_id: "a", name: "ai_generate", created_at: "now", props: { trackId: "ai-foundations" } },
        { user_id: "b", name: "ai_generate", created_at: "now", props: { trackId: "other-track" } },
        { user_id: "c", name: "ai_generate", created_at: "now" },
        { user_id: "d", name: "lesson_started", created_at: "now", props: { trackId: "ai-foundations" } },
      ],
      onboardedCount: 4,
    });
    expect(r).toEqual({ activated: 1, activatedPct: 25 });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: FAIL — `track1Activation` doesn't exist yet.

- [ ] **Step 3: Implement `track1ActivatedUserIds` and `track1Activation`**

Add this to `lib/measurement/metrics.ts`, anywhere after `acquisitionBySource`:

```ts
/** Distinct user ids with an ai_generate event scoped to Track 1 (Foundations). */
function track1ActivatedUserIds(events: EventRow[]): Set<string> {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.name !== "ai_generate") continue;
    if (e.props?.trackId !== FOUNDATIONS_TRACK_ID) continue;
    ids.add(e.user_id);
  }
  return ids;
}

export interface Track1Activation {
  activated: number;
  activatedPct: number;
}

/** Activation defined as: first (any) ai_generate action scoped to Track 1.
 *  Additive to activationCounts — does not replace it. */
export function track1Activation(input: {
  events: EventRow[];
  onboardedCount: number;
}): Track1Activation {
  const activated = track1ActivatedUserIds(input.events).size;
  return { activated, activatedPct: pct(activated, input.onboardedCount) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/measurement/metrics.ts lib/measurement/metrics.test.ts
git commit -m "Add track1Activation to lib/measurement/metrics.ts"
```

---

### Task 7: `lib/measurement/metrics.ts` — `retentionD7` and `retentionByStreak`

**Files:**
- Modify: `lib/measurement/metrics.ts`
- Modify: `lib/measurement/metrics.test.ts`

**Interfaces:**
- Consumes: `computeStreak` and `activeDatesFromEvents` from `@/lib/gamification/streak` (existing, unmodified).
- Produces:
  - `interface RetentionStat { eligible: number; retained: number; retainedPct: number }`
  - `retentionD7(input: { profiles: ProfileRow[]; events: EventRow[]; now?: Date }): RetentionStat` — used by Task 9.
  - `retentionByStreak(input: { profiles: ProfileRow[]; events: EventRow[]; now?: Date }): RetentionStat` — used by Task 9.

- [ ] **Step 1: Write the failing tests**

Add `retentionD7` and `retentionByStreak` to the import block at the top of `lib/measurement/metrics.test.ts`:

```ts
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  journeyFunnel,
  reflectionValueByLesson,
  lessonHealthRanking,
  acquisitionBySource,
  track1Activation,
  retentionD7,
  retentionByStreak,
} from "./metrics";
```

Then add these two tests:

```ts
  it("retentionD7 counts a user as retained if they have an event 7+ days after onboarding", () => {
    const now = new Date("2026-09-10T00:00:00Z");
    const r = retentionD7({
      profiles: [
        { user_id: "a", onboarded_at: "2026-09-01T00:00:00Z" }, // 9 days ago, eligible
        { user_id: "b", onboarded_at: "2026-09-01T00:00:00Z" }, // eligible, no return
        { user_id: "c", onboarded_at: "2026-09-08T00:00:00Z" }, // only 2 days ago — not eligible
      ],
      events: [
        { user_id: "a", name: "lesson_started", created_at: "2026-09-09T00:00:00Z" }, // 8 days after onboarding
      ],
      now,
    });
    expect(r).toEqual({ eligible: 2, retained: 1, retainedPct: 50 });
  });

  it("retentionByStreak counts a user as retained if their current streak is >= 7", () => {
    const now = new Date("2026-09-10T00:00:00Z");
    const activeDates = [
      "2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07",
      "2026-09-08", "2026-09-09", "2026-09-10",
    ];
    const r = retentionByStreak({
      profiles: [
        { user_id: "a", onboarded_at: "2026-08-01T00:00:00Z" },
        { user_id: "b", onboarded_at: "2026-08-01T00:00:00Z" },
      ],
      events: [
        ...activeDates.map((d) => ({ user_id: "a", name: "lesson_started", created_at: `${d}T09:00:00Z` })),
        { user_id: "b", name: "lesson_started", created_at: "2026-09-10T09:00:00Z" },
      ],
      now,
    });
    expect(r).toEqual({ eligible: 2, retained: 1, retainedPct: 50 });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: FAIL — neither function exists yet.

- [ ] **Step 3: Implement `retentionD7` and `retentionByStreak`**

Add the import at the top of `lib/measurement/metrics.ts` (alongside the existing imports):

```ts
import { computeStreak, activeDatesFromEvents } from "@/lib/gamification/streak";
```

Then add this to `lib/measurement/metrics.ts`, anywhere after `track1Activation`:

```ts
export interface RetentionStat {
  eligible: number;
  retained: number;
  retainedPct: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** % of users onboarded >=7 days ago with >=1 event 7+ days after onboarding. */
export function retentionD7(input: {
  profiles: ProfileRow[];
  events: EventRow[];
  now?: Date;
}): RetentionStat {
  const now = input.now ?? new Date();
  const eventsByUser = new Map<string, EventRow[]>();
  for (const e of input.events) {
    const list = eventsByUser.get(e.user_id) ?? [];
    list.push(e);
    eventsByUser.set(e.user_id, list);
  }

  let eligible = 0;
  let retained = 0;
  for (const p of input.profiles) {
    if (!p.onboarded_at) continue;
    const onboardedAt = new Date(p.onboarded_at).getTime();
    if (now.getTime() - onboardedAt < 7 * DAY_MS) continue;
    eligible++;
    const threshold = onboardedAt + 7 * DAY_MS;
    const hasReturned = (eventsByUser.get(p.user_id) ?? []).some(
      (e) => new Date(e.created_at).getTime() >= threshold,
    );
    if (hasReturned) retained++;
  }
  return { eligible, retained, retainedPct: pct(retained, eligible) };
}

/** % of onboarded users whose current streak (via computeStreak) is >= 7. */
export function retentionByStreak(input: {
  profiles: ProfileRow[];
  events: EventRow[];
  now?: Date;
}): RetentionStat {
  const now = input.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const eventsByUser = new Map<string, EventRow[]>();
  for (const e of input.events) {
    const list = eventsByUser.get(e.user_id) ?? [];
    list.push(e);
    eventsByUser.set(e.user_id, list);
  }

  let eligible = 0;
  let retained = 0;
  for (const p of input.profiles) {
    if (!p.onboarded_at) continue;
    eligible++;
    const userEvents = eventsByUser.get(p.user_id) ?? [];
    const activeDates = activeDatesFromEvents(
      userEvents.map((e) => ({ createdAt: e.created_at })),
    );
    const { current } = computeStreak(activeDates, today);
    if (current >= 7) retained++;
  }
  return { eligible, retained, retainedPct: pct(retained, eligible) };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/measurement/metrics.ts lib/measurement/metrics.test.ts
git commit -m "Add retentionD7 and retentionByStreak to lib/measurement/metrics.ts"
```

---

### Task 8: `lib/measurement/metrics.ts` — `referralFunnel`

**Files:**
- Modify: `lib/measurement/metrics.ts`
- Modify: `lib/measurement/metrics.test.ts`

**Interfaces:**
- Consumes: the private `track1ActivatedUserIds` helper added in Task 6 (same file, no import needed).
- Produces: `interface ReferralFunnelStat { sharesSent: number; signupsAttributed: number; referredActivatedPct: number; organicActivatedPct: number }` and `referralFunnel(input: { events: EventRow[]; profiles: ProfileRow[] }): ReferralFunnelStat` — used by Task 9.

- [ ] **Step 1: Write the failing test**

Add `referralFunnel` to the import block at the top of `lib/measurement/metrics.test.ts`:

```ts
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  journeyFunnel,
  reflectionValueByLesson,
  lessonHealthRanking,
  acquisitionBySource,
  track1Activation,
  retentionD7,
  retentionByStreak,
  referralFunnel,
} from "./metrics";
```

Then add this test:

```ts
  it("referralFunnel computes shares sent, signups attributed, and activation rate for referred vs organic", () => {
    const r = referralFunnel({
      events: [
        { user_id: "a", name: "referral_link_shared", created_at: "now" },
        { user_id: "a", name: "referral_link_shared", created_at: "now" },
        { user_id: "b", name: "ai_generate", created_at: "now", props: { trackId: "ai-foundations" } },
        { user_id: "d", name: "ai_generate", created_at: "now", props: { trackId: "ai-foundations" } },
      ],
      profiles: [
        { user_id: "b", onboarded_at: "now", referred_by: "a" }, // referred, activated
        { user_id: "c", onboarded_at: "now", referred_by: "a" }, // referred, not activated
        { user_id: "d", onboarded_at: "now", referred_by: null }, // organic, activated
        { user_id: "e", onboarded_at: "now", referred_by: null }, // organic, not activated
      ],
    });
    expect(r).toEqual({
      sharesSent: 2,
      signupsAttributed: 2,
      referredActivatedPct: 50,
      organicActivatedPct: 50,
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: FAIL — `referralFunnel` doesn't exist yet.

- [ ] **Step 3: Implement `referralFunnel`**

Add this to `lib/measurement/metrics.ts`, anywhere after `retentionByStreak`:

```ts
export interface ReferralFunnelStat {
  sharesSent: number;
  signupsAttributed: number;
  referredActivatedPct: number;
  organicActivatedPct: number;
}

/** Shares sent -> signups attributed -> activation rate, referred vs. organic. */
export function referralFunnel(input: {
  events: EventRow[];
  profiles: ProfileRow[];
}): ReferralFunnelStat {
  const sharesSent = input.events.filter(
    (e) => e.name === "referral_link_shared",
  ).length;
  const referred = input.profiles.filter((p) => p.referred_by);
  const organic = input.profiles.filter((p) => !p.referred_by);
  const activated = track1ActivatedUserIds(input.events);

  const activatedCount = (rows: ProfileRow[]) =>
    rows.filter((p) => activated.has(p.user_id)).length;

  return {
    sharesSent,
    signupsAttributed: referred.length,
    referredActivatedPct: pct(activatedCount(referred), referred.length),
    organicActivatedPct: pct(activatedCount(organic), organic.length),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/measurement/metrics.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check and run the full suite**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors; all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/measurement/metrics.ts lib/measurement/metrics.test.ts
git commit -m "Add referralFunnel to lib/measurement/metrics.ts"
```

---

### Task 9: Wire the four new sections into the Admin dashboard

**Files:**
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `acquisitionBySource` (Task 5), `track1Activation` (Task 6), `retentionD7`/`retentionByStreak` (Task 7), `referralFunnel` (Task 8) — all from `@/lib/measurement/metrics`.
- Produces: nothing consumed by a later task — this is the final task.

`app/admin/page.tsx` has no dedicated test file in this codebase today (it's a server component doing live Supabase reads, matching its current zero test coverage). This task is verified via `tsc --noEmit` and a manual check against local dev data (Step 5 below), consistent with how this file is verified today.

Section order: the four new sections read top-to-bottom as the funnel itself does — **Acquisition** is inserted first (right after the page's `<h1>`), **Activation**'s existing section gets one new row appended, then **Retention** and **Referral** are inserted as new sections directly after Activation. The four pre-existing sections below Activation (confidence-change, notify-demand, per-journey, content-quality) are untouched and keep their current order.

- [ ] **Step 1: Add `referred_by` to the profiles query and import the new functions**

In `app/admin/page.tsx`, change the import block from:

```ts
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  journeyFunnel,
  reflectionValueByLesson,
  lessonHealthRanking,
  type SurveyRow,
  type EventRow,
  type TrackInput,
} from "@/lib/measurement/metrics";
```

to:

```ts
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  journeyFunnel,
  reflectionValueByLesson,
  lessonHealthRanking,
  acquisitionBySource,
  track1Activation,
  retentionD7,
  retentionByStreak,
  referralFunnel,
  type SurveyRow,
  type EventRow,
  type ProfileRow,
  type TrackInput,
} from "@/lib/measurement/metrics";
```

Change the profiles query from:

```ts
    admin.from("profiles").select("user_id, onboarded_at"),
```

to:

```ts
    admin.from("profiles").select("user_id, onboarded_at, referred_by"),
```

- [ ] **Step 2: Compute the four new metrics**

After the existing block:

```ts
  const progressRows = progress.data ?? [];
  const eventRows = (events.data ?? []) as EventRow[];

  const funnel = activationCounts({
    profiles: profiles.data ?? [],
    progress: progressRows,
    events: eventRows,
  });
```

add:

```ts
  const profileRows = (profiles.data ?? []) as ProfileRow[];
  const acquisition = acquisitionBySource(profileRows);
  const track1 = track1Activation({ events: eventRows, onboardedCount: funnel.onboarded });
  const retentionReturn = retentionD7({ profiles: profileRows, events: eventRows });
  const retentionStreak = retentionByStreak({ profiles: profileRows, events: eventRows });
  const referral = referralFunnel({ events: eventRows, profiles: profileRows });
```

(Note: `profiles.data ?? []` is used twice now — once inline for `activationCounts` as before, and once assigned to `profileRows` for the four new functions above. Leave the existing inline usage in `activationCounts` exactly as it is; only add the new `profileRows` line and the four new computations.)

- [ ] **Step 3: Render the Acquisition section**

Immediately after the opening `<h1>` block (right before the existing `<section>` that starts with `Activation funnel`), add:

```tsx
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Acquisition — new signups by source
        </h2>
        {acquisition.length === 0 ? (
          <p className="text-sm text-muted">No signups yet.</p>
        ) : (
          acquisition.map((w) => (
            <Row
              key={w.weekStart}
              label={`Week of ${w.weekStart}`}
              value={`${w.organic} organic · ${w.referred} referred`}
            />
          ))
        )}
      </section>

```

- [ ] **Step 4: Append the Track 1 row to Activation, and add Retention + Referral sections**

Inside the existing Activation funnel `<section>`, immediately after its last `<Row ... />` (the "Completed the track" row) and before that section's closing `</section>`, add:

```tsx
        <Row
          label="Activated Track 1 (first generate)"
          value={`${track1.activated} (${track1.activatedPct}%)`}
        />
```

Then, immediately after that Activation `</section>`'s closing tag (and before the existing "Confidence change" `<section>`), add two new sections:

```tsx

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Retention
        </h2>
        <Row
          label="Returned 7+ days after onboarding"
          value={`${retentionReturn.retained}/${retentionReturn.eligible} (${retentionReturn.retainedPct}%)`}
        />
        <Row
          label="Streak of 7+ days"
          value={`${retentionStreak.retained}/${retentionStreak.eligible} (${retentionStreak.retainedPct}%)`}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Referral
        </h2>
        <Row label="Shares sent" value={referral.sharesSent} />
        <Row label="Signups attributed" value={referral.signupsAttributed} />
        <Row
          label="Activation rate — referred users"
          value={`${referral.referredActivatedPct}%`}
        />
        <Row
          label="Activation rate — organic users"
          value={`${referral.organicActivatedPct}%`}
        />
      </section>
```

- [ ] **Step 5: Type-check, run the full suite, and manually verify**

Run: `npx tsc --noEmit && npx vitest run`
Expected: no type errors; all tests PASS (this task adds no new tests of its own — it's verified structurally here and functionally by every test added in Tasks 5-8, since this task only wires already-tested pure functions into JSX).

Then start the dev server (`npm run dev`) and load `/admin` while signed in as an admin user, confirming the four new sections render without runtime errors and show sensible values (zeros/empty-state text are fine for a fresh local dataset).

- [ ] **Step 6: Commit**

```bash
git add app/admin/page.tsx
git commit -m "Wire Acquisition/Retention/Referral sections and Track-1 Activation into the Admin dashboard"
```
