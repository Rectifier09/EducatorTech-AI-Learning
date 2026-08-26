# Referral & Share Flow — Design

## Goal

Let a teacher share the app with a colleague via WhatsApp, and attribute
any resulting signup back to the specific teacher who shared it —
tracking only, no reward or incentive in this pass. This is the first of
two related pieces of work; a follow-up pass refines the Mixpanel funnel
(Acquisition/Activation/Retention/Referral) to report on the data this
feature produces.

## Scope

**In scope:** per-user referral link generation, a WhatsApp share button
in two places (You tab, lesson-complete reward screen), attribution
capture at signup (`referred_by` on `profiles`), two new analytics
events (`referral_link_shared`, `referral_signup`).

**Out of scope (explicitly deferred):**
- Any reward, XP, or badge tied to referring or being referred.
- A referrer-facing "N people you invited" view or leaderboard — the
  data (`profiles.referred_by`) supports this later, but no UI for it
  ships now.
- A dedicated pre-login landing page for referral links — `/r/<code>`
  redirects straight to the existing `/login` page.
- Any non-WhatsApp share channel (native share sheet, copy-link, email).
- The Mixpanel funnel refinement itself — separate spec, separate plan.

## Data model

Migration `0006_referrals.sql`, additive, following the existing
`add column if not exists` convention:

```sql
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references auth.users(id);
```

Both nullable. `referral_code` is generated lazily (first time a user
opens the Share UI), not eagerly for every profile — consistent with
this codebase's existing lazy-profile-creation pattern (a `profiles` row
itself isn't created until onboarding Step 2 today). `referred_by` is
written at most once, at signup-attribution time, and never overwritten.

No new table: "who did I refer" is `select * from profiles where
referred_by = <my user id>` — no separate join table needed since each
user has at most one referrer.

## Link format + attribution capture

**Link:** `<origin>/r/<code>`.

**New route `app/r/[code]/route.ts`:**
1. Look up `code` in `profiles.referral_code`. If no match, redirect to
   `/login` immediately (no cookie set) — an invalid/typo'd code fails
   silently, never shows an error page.
2. If found, set a cookie `referred_by=<referrer_user_id>` (httpOnly,
   ~30-day expiry) and redirect to `/login`.

**Capture, in the existing `app/auth/callback/route.ts`,** right after
the OAuth session is established:
1. Read the `referred_by` cookie. If absent, do nothing (today's
   behavior, unchanged).
2. If present, check whether a `profiles` row already exists for the
   newly-authenticated user (`getProfile(user.id)`).
   - **No existing row** (genuinely new user): if the cookie's referrer
     id is not the same as the new user's own id (self-referral guard),
     call `upsertProfile(user.id, { referredBy: <cookie value> })` and
     `logEvent("referral_signup", { referredBy: <cookie value> })`, then
     clear the cookie.
   - **Existing row** (returning user re-clicking a link, or clicking
     their own link while signed out): do nothing — never overwrite
     `referred_by`, never log the event twice.

This is the earliest point attribution can be captured, so it survives
even if the user abandons onboarding immediately after signing in —
unlike waiting for `completeOnboarding()`.

## Share UI

**New component `components/share/ShareApp.tsx`:** on mount, calls a new
server action `getOrCreateReferralCode()` (in `app/actions/referral.ts`)
which reads `profiles.referral_code`, generating and persisting an
8-character random code on first call if none exists (idempotent — a
second call returns the same code; on the practically-impossible case of
a unique-constraint collision, retry generation once). Renders the full
`<origin>/r/<code>` link and a single **"Share on WhatsApp"** button
built from a `https://wa.me/?text=<url-encoded message>` link (no new
dependency — this works for both the WhatsApp mobile app and WhatsApp
Web via a plain anchor/link click, no SDK needed). Message copy:

> "I've been using SahajAiVidya to make worksheets and quizzes in minutes
> instead of hours — thought you'd like it too: `<link>`"

Clicking the share button fires `referral_link_shared` (no props needed
— `distinct_id` already identifies the referrer) before the `wa.me` link
opens.

**Two entry points, same component:**
1. **You tab** (`components/you/YouProfile.tsx`, the file that already
   renders the Privacy/Terms footer links) — a permanent card showing
   the link and share button, always available.
2. **Lesson-complete reward screen** (`components/lesson/LessonComplete.tsx`,
   which renders the shared `RewardMoment` component) — a lightweight
   "Know a teacher who'd love this?" prompt reusing the same `ShareApp`
   component, shown after a completed lesson.

## Event tracking

- `referral_link_shared` — referrer's own event stream, fired on share-button tap.
- `referral_signup` — new user's own event stream, fired once at
  attribution-capture time, `{ referredBy: <referrer_user_id> }`.

Both flow through the existing `logEvent()` chokepoint
(`lib/data/events.ts`), so they land in both the Supabase `events` table
and Mixpanel automatically — no separate wiring needed for this pass.

## Error handling

- Invalid/unknown code at `/r/<code>` → silent redirect to `/login`, no
  cookie, no error shown.
- Self-referral guard at the callback (described above).
- Existing users never get `referred_by` overwritten.
- Referral code generation retries once on a unique-constraint collision
  (practically never triggered at 8 random characters).

## Testing strategy

- **Unit:** referral-code generation (format, and that a second call to
  `getOrCreateReferralCode()` is idempotent); the attribution-capture
  branch logic in the callback (new-user vs. existing-user, cookie
  present/absent, self-referral guard) with `upsertProfile`/`getProfile`
  mocked, matching this repo's existing action-test mocking style.
- **Component:** `ShareApp` renders the link and a correctly
  URL-encoded `wa.me` href; share-button click fires
  `referral_link_shared` (via a mocked `logEvent`/server action).
- **Regression:** existing `auth/callback` behavior (session
  establishment, `next` redirect, `/login?error=auth` on failure) must
  keep working exactly as today for the no-cookie case — the whole
  referral branch is additive, gated behind "cookie present."

## Global constraints

- TDD required for every behavior change.
- No new dependencies — `wa.me` links need nothing beyond a plain
  anchor; no WhatsApp SDK, no share-sheet library.
- Follows existing migration conventions (`000N_<name>.sql`, additive,
  `add column if not exists`).
- Follows existing server-action/data-layer patterns (`lib/data/*`,
  `app/actions/*`) rather than introducing a new architectural layer.
- Must not regress the existing OAuth callback flow for users who did
  not arrive via a referral link (the large majority of traffic today).
