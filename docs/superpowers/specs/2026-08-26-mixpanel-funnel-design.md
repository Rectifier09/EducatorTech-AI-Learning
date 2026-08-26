# Mixpanel Acquisition/Activation/Retention/Referral Funnel — Design

**Status:** Approved for planning
**Author context:** Follow-up to the 2026-08-26 referral/share feature, explicitly deferred as its own project (see `docs/superpowers/specs/2026-08-26-referral-share-design.md` and the Vault build log entry for that feature).

## Problem

Mixpanel is wired into the app (`lib/analytics/mixpanel-client.ts` for client autocapture, `lib/analytics/mixpanel-server.ts` + `lib/data/events.ts`'s `logEvent()` mirroring every server-side event), but there is no way to see users move through the stages that actually matter for a pilot: how they arrived (**Acquisition**), whether they got real value (**Activation**), whether they came back (**Retention**), and whether the new referral loop is working (**Referral**). Two concrete gaps:

1. **No Acquisition/Retention concept exists anywhere** — not in Mixpanel, not in the in-app Admin dashboard (`app/admin/page.tsx`), which today only has an Activation funnel (lesson-completion based), a confidence-delta section, "notify me" demand, a per-journey funnel, and a content-quality ranking.
2. **`ai_generate` events carry no track/lesson attribution.** The user's own definition of Activation — "first generate action on Learning Track 1" — cannot be computed today, because `handleGenerate()` logs `ai_generate` with only `{ mode, provider }`. The closest existing proxy, `artifact_saved`, is a save-side-effect that fires after a successful generate, not the generate action itself, and isn't guaranteed 1:1 with it (a lesson block can set `saveToToolkit: false`).

A secondary but real gap: Mixpanel has no way to distinguish a referred signup from an organic one on the user's *profile* (only in our own `events`/`profiles` tables), so anyone exploring data directly in Mixpanel's UI can't slice by acquisition source.

## Non-goals

- No changes to Mixpanel's own Boards/Insights configuration — that happens in Mixpanel's UI, not in this codebase.
- No change to the *existing* Activation funnel definition (`activationCounts` in `lib/measurement/metrics.ts`) — it has pass/fail targets tied to the pilot spec and stays as-is. The new "Track 1 generate" metric is additive, not a replacement.
- No fix to Mixpanel's project-level Identity Merge setting — that's a dashboard toggle in Mixpanel's own settings, not something this codebase can read or change. Flagged as a manual verification step for the project owner (see "Manual step" below).
- No reward/incentive logic for referrals — unchanged from the existing feature's explicit scope.

## Data model / instrumentation changes

### `ai_generate` gains `trackId`

Threaded through the one path that has it available — the in-lesson "make"/"refine" Playground block:

- `lib/ai/client.ts`'s `requestGenerate()` gains an optional 5th parameter `trackId?: string | null`, included in the POST body.
- `app/api/ai/generate/route.ts` reads `body.trackId` (`typeof body.trackId === "string" ? body.trackId : null`) and passes it to `handleGenerate()`.
- `lib/ai/handler.ts`'s `handleGenerate()` gains an optional `trackId?: string | null` input, included in the `logEvent("ai_generate", { mode, provider, trackId })` call.
- `components/playground/Playground.tsx` gains an optional `trackId?: string | null` prop (default `null`, same style as its existing `lessonId` prop), forwarded into `requestGenerate()`.
- `components/lesson/blocks/PlaygroundBlockView.tsx` passes its existing `trackId` prop down to `<Playground trackId={trackId} .../>`.
- `app/create/page.tsx` (Studio Playground — the only other place `<Playground>` is rendered) passes nothing — `trackId` stays `null`, exactly like today's `ai_generate` events with no track context.

This is purely additive: `trackId` is optional everywhere, existing callers that don't pass it are unaffected, and no existing test's expectations on `ai_generate`'s prior shape change (they'll still pass — they just won't assert the new field).

### Mixpanel profile properties — `acquisition_source`

New function in `lib/analytics/mixpanel-server.ts`, matching the existing `trackServer`'s fire-and-forget, never-throws shape:

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

Called once, in `app/actions/onboarding.ts`'s `completeOnboarding()`, right after the existing `logEvent("onboarding_completed")` call:

```ts
const profile = await getProfile(user.id);
await setProfileProperties(user.id, {
  acquisition_source: profile?.referredBy ? "referral" : "organic",
});
```

(`getProfile` is already imported elsewhere in this file's sibling actions; `completeOnboarding` needs to add the import.) This makes the organic/referred split queryable directly in Mixpanel's own UI, independent of the in-app dashboard below.

**Manual step (not code):** whether pre-signup anonymous pageviews (captured before a user has an id) merge into their identified profile once `identify()` fires depends on Mixpanel's project-level Identity Merge setting (Settings → Identity Merge → "Simplified"). This is a dashboard toggle, not something this codebase configures — worth a one-time check in Mixpanel's UI, but out of scope for this implementation.

## `lib/measurement/metrics.ts` additions

All five new functions are pure (no I/O), following the exact pattern of every existing function in this file — they take the same `ProfileRow[]` / `ProgressRow[]` / `EventRow[]` shapes already defined there, or trivial extensions of them.

`ProfileRow` gains one new optional field, following the same precedent as `EventRow.props` (already optional so callers that don't need it, like `activationCounts`, can omit it in tests):

```ts
export interface ProfileRow {
  user_id: string;
  onboarded_at: string | null;
  /** Optional: only populated by callers that fetched it (Acquisition/Referral
   *  sections). Missing or null both mean "not referred" (organic). */
  referred_by?: string | null;
}
```

### 1. `acquisitionBySource` — weekly new-signup counts, organic vs. referred

```ts
export interface AcquisitionWeek {
  /** Monday of the week, YYYY-MM-DD (UTC). */
  weekStart: string;
  organic: number;
  referred: number;
}

export function acquisitionBySource(profiles: ProfileRow[]): AcquisitionWeek[]
```

Buckets `onboarded_at` into ISO week-start (Monday, UTC) and counts organic (`!p.referred_by`) vs. referred (`!!p.referred_by`) per week, sorted oldest-first. Profiles with no `onboarded_at` are excluded (not yet onboarded, same filter `activationCounts` already applies).

### 2. `track1Activation` — first generate action on Track 1

```ts
export interface Track1Activation {
  activated: number;
  activatedPct: number; // of `onboarded` count, same denominator as activationCounts
}

export function track1Activation(input: {
  events: EventRow[];
  onboardedCount: number;
}): Track1Activation
```

Counts distinct `user_id` values among events where `name === "ai_generate"` and `props?.trackId === FOUNDATIONS_TRACK_ID`. Shown as a new row appended to the *existing* Activation section — it does not touch `activationCounts`.

### 3 & 4. `retentionD7` and `retentionByStreak`

```ts
export interface RetentionStat {
  eligible: number; // denominator: users onboarded >= 7 days ago
  retained: number;
  retainedPct: number;
}

/** % of users onboarded >=7 days ago with >=1 event 7+ days after onboarded_at. */
export function retentionD7(input: {
  profiles: ProfileRow[];
  events: EventRow[];
  now?: Date; // defaults to `new Date()`; overridable for deterministic tests
}): RetentionStat

/** % of onboarded users whose current streak (via the existing
 * computeStreak/activeDatesFromEvents from lib/gamification/streak.ts) is >= 7. */
export function retentionByStreak(input: {
  profiles: ProfileRow[];
  events: EventRow[];
  now?: Date;
}): RetentionStat
```

`retentionD7` groups events by `user_id`, and for each eligible profile (`onboarded_at` at least 7 days before `now`) checks whether any event's `created_at` is ≥ `onboarded_at + 7 days`. `retentionByStreak` reuses `activeDatesFromEvents` (grouping each user's events into their local activity dates) and `computeStreak` unchanged — no new streak logic, just per-user aggregation over the same events already loaded for every other section.

### 5. `referralFunnel`

```ts
export interface ReferralFunnelStat {
  sharesSent: number; // count of referral_link_shared events
  signupsAttributed: number; // profiles with referred_by set
  referredActivatedPct: number; // % of those signups with Track-1 activation
  organicActivatedPct: number; // same metric, for non-referred users — the comparison baseline
}

export function referralFunnel(input: {
  events: EventRow[];
  profiles: ProfileRow[];
}): ReferralFunnelStat
```

`sharesSent` = count of `referral_link_shared` events (not distinct users — a user can share more than once and each share is a real acquisition attempt). `signupsAttributed` = count of profiles with `referred_by` set. The two activation percentages both reuse the same "has an `ai_generate` event with `trackId === FOUNDATIONS_TRACK_ID`" definition as `track1Activation`, split by whether the user's own `referred_by` is set — this is the direct answer to "do referred users convert better or worse than organic ones."

## Admin dashboard (`app/admin/page.tsx`)

Four new sections, inserted after the existing Activation funnel section (Acquisition first, since it's the top of the funnel), using the same `Row` component and card styling already established on this page:

1. **Acquisition** — one `Row` per week from `acquisitionBySource`, label = week-start date, value = `"{organic} organic · {referred} referred"`.
2. **Activation** — existing section unchanged, with one new `Row` appended: `"Activated Track 1 (first generate)"` → `track1Activation`'s count and percentage.
3. **Retention** — two `Row`s: D7 return rate and streak-based rate, each showing `retained/eligible (pct%)`.
4. **Referral** — `Row`s for shares sent, signups attributed, referred-users activation %, and organic-users activation % directly beneath it for comparison.

The page's existing `Promise.all` query already fetches `profiles` and `events`; it needs one addition — `referred_by` to the `profiles` select (currently `"user_id, onboarded_at"` → `"user_id, onboarded_at, referred_by"`) — no new queries required.

## Testing

Every new `metrics.ts` function gets unit tests against hand-constructed rows, matching the existing style in `lib/measurement/metrics.test.ts` (e.g. `activationCounts`'s and `journeyFunnel`'s tests) — no mocking, pure input/output assertions, including edge cases (empty input, a profile with no `onboarded_at`, a user with events but no `ai_generate`, `now` passed explicitly for the two retention functions to keep them deterministic).

The `trackId`-threading change updates the existing tests for `requestGenerate` (`lib/ai/client.test.ts` if present, else the call sites' own tests), `handleGenerate` (`lib/ai/handler.test.ts`), and `Playground`/`PlaygroundBlockView` component tests wherever they assert on the generate request body or `logEvent` call arguments — adding assertions for the new field's presence/absence rather than replacing existing assertions.

`setProfileProperties` gets a unit test mirroring `mixpanel-server.test.ts`'s existing `trackServer` tests: no-ops without a token, POSTs the expected body shape with a token, never throws on a fetch rejection.

## Error handling

- `setProfileProperties` follows the established "analytics must never throw" convention identically to `trackServer` — wrapped in try/catch, logged via `console.error`, never propagated.
- The `trackId` addition is optional everywhere; a missing/malformed value degrades to `null` (already-null today), never an error.
- Admin dashboard sections render their existing "no data yet" fallbacks (matching the pattern already used for `journeys.length === 0` and `demand.length === 0`) when a new section's underlying counts are all zero, rather than showing a confusing 0%/0 for an empty pilot cohort.
