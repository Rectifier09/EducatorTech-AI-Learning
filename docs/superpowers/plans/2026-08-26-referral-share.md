# Referral & Share Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a teacher share the app via WhatsApp using a personal
referral link, and attribute any resulting signup back to them —
tracking only, no reward.

**Architecture:** Two new nullable `profiles` columns (`referral_code`,
`referred_by`); a new `/r/[code]` route that resolves a code to its
owner and drops a short-lived cookie; the existing OAuth callback reads
that cookie once, at the earliest point a new user exists, and attributes
the signup; a small self-contained `ShareApp` client component fetches
its own referral link via a server action and renders a WhatsApp share
link, embedded in two places (You tab, lesson-complete).

**Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase, Vitest +
React Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-26-referral-share-design.md`

## Global Constraints

- TDD required for every behavior change (test first, watch it fail,
  minimal code, watch it pass).
- No new dependencies — WhatsApp sharing uses a plain `https://wa.me/`
  link, no SDK.
- Follows existing migration convention: `000N_<name>.sql`, additive,
  `add column if not exists`.
- Follows existing `app/actions/*` (`"use server"` file-level directive)
  and `lib/data/*` patterns — no new architectural layer.
- Must not regress the existing OAuth callback for the large majority of
  users who do not arrive via a referral link (no cookie present).
- Self-referral guard: a user can never be attributed as their own
  referrer.
- No reward, XP, or badge tied to referrals in this plan.

---

### Task 1: Add `referral_code` and `referred_by` columns

**Files:**
- Create: `supabase/migrations/0006_referrals.sql`

**Interfaces:**
- Produces: `profiles.referral_code text unique`, `profiles.referred_by uuid references auth.users(id)` — consumed by every later task in this plan.

- [ ] **Step 1: Write the migration**

```sql
-- 0006_referrals.sql
-- Referral attribution: each user can have their own shareable code, and
-- at most one referrer. Both nullable — null referral_code means "hasn't
-- opened the Share UI yet"; null referred_by means "signed up organically".
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references auth.users(id);
```

- [ ] **Step 2: Apply the migration**

Run: `npm run db:migrate`
Expected: migration applies cleanly with no errors (this project has no
separate dev database — this runs against the same Supabase project used
by `npm run dev`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0006_referrals.sql
git commit -m "Add referral_code and referred_by columns to profiles"
```

---

### Task 2: Extend the `Profile` type and its mappers

**Files:**
- Modify: `lib/data/types.ts`
- Modify: `lib/data/mappers.ts`
- Test: `lib/data/mappers.test.ts`

**Interfaces:**
- Consumes: the two new columns from Task 1.
- Produces: `Profile.referralCode: string | null`, `Profile.referredBy: string | null` — consumed by Tasks 3, 4, 6, 7.

- [ ] **Step 1: Write the failing test**

Update `lib/data/mappers.test.ts` to the following full content (adds
`referral_code`/`referred_by` to the row-mapping test, and adds the two
new fields to the two full `Profile` object literals in the
`isOnboardingComplete` test so they still type-check):

```ts
import { describe, it, expect } from "vitest";
import { rowToProfile, profileToRow, isOnboardingComplete } from "./mappers";

describe("profile mappers", () => {
  it("maps a db row (snake_case) to a Profile (camelCase)", () => {
    const p = rowToProfile({
      user_id: "u1",
      role: "School teacher",
      subject: "Science",
      grade_band: "Middle",
      confidence_using: 2,
      confidence_trust: 3,
      attitude: "skeptical",
      reminder_time: null,
      onboarded_at: "2026-08-20T00:00:00Z",
      referral_code: "ABCD1234",
      referred_by: "referrer-1",
    });
    expect(p).toMatchObject({
      userId: "u1",
      subject: "Science",
      gradeBand: "Middle",
      confidenceUsing: 2,
      attitude: "skeptical",
      onboardedAt: "2026-08-20T00:00:00Z",
      referralCode: "ABCD1234",
      referredBy: "referrer-1",
    });
  });

  it("defaults referralCode/referredBy to null when the row omits them", () => {
    const p = rowToProfile({
      user_id: "u1",
      role: null,
      subject: null,
      grade_band: null,
      confidence_using: null,
      confidence_trust: null,
      attitude: null,
      reminder_time: null,
      onboarded_at: null,
    });
    expect(p.referralCode).toBeNull();
    expect(p.referredBy).toBeNull();
  });

  it("maps a partial Profile patch back to a snake_case row, dropping undefined", () => {
    const row = profileToRow({ gradeBand: "Senior", attitude: "curious" });
    expect(row).toEqual({ grade_band: "Senior", attitude: "curious" });
  });

  it("maps referralCode/referredBy patches to their snake_case columns", () => {
    const row = profileToRow({ referralCode: "ABCD1234", referredBy: "referrer-1" });
    expect(row).toEqual({ referral_code: "ABCD1234", referred_by: "referrer-1" });
  });

  it("treats onboarding incomplete until all core fields + onboardedAt are set", () => {
    expect(isOnboardingComplete(null)).toBe(false);
    expect(
      isOnboardingComplete({
        userId: "u",
        role: "t",
        subject: "s",
        gradeBand: "g",
        confidenceUsing: 1,
        confidenceTrust: 1,
        attitude: "curious",
        reminderTime: null,
        onboardedAt: null,
        alias: null,
        displayName: null,
        referralCode: null,
        referredBy: null,
      }),
    ).toBe(false);
    expect(
      isOnboardingComplete({
        userId: "u",
        role: "t",
        subject: "s",
        gradeBand: "g",
        confidenceUsing: 1,
        confidenceTrust: 1,
        attitude: "curious",
        reminderTime: null,
        onboardedAt: "2026-08-20T00:00:00Z",
        alias: null,
        displayName: null,
        referralCode: null,
        referredBy: null,
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/data/mappers.test.ts`
Expected: FAIL — `referral_code`/`referred_by` are not valid `ProfileRow`
keys yet, and `referralCode`/`referredBy` don't exist on `Profile` (both
a type error and the new assertions failing).

- [ ] **Step 3: Write minimal implementation**

In `lib/data/types.ts`, add two fields to the `Profile` interface:

```ts
export interface Profile {
  userId: string;
  role: string | null;
  subject: string | null;
  gradeBand: string | null;
  confidenceUsing: number | null;
  confidenceTrust: number | null;
  attitude: Attitude | null;
  reminderTime: string | null;
  onboardedAt: string | null;
  alias: string | null;
  displayName: string | null;
  referralCode: string | null;
  referredBy: string | null;
}
```

In `lib/data/mappers.ts`, update `ProfileRow`, `FIELD_TO_COLUMN`,
`rowToProfile`, and add referral fields there. Replace the whole file
with:

```ts
import type { Attitude, Profile } from "./types";

export interface ProfileRow {
  user_id: string;
  role: string | null;
  subject: string | null;
  grade_band: string | null;
  confidence_using: number | null;
  confidence_trust: number | null;
  attitude: string | null;
  reminder_time: string | null;
  onboarded_at: string | null;
  alias?: string | null;
  display_name?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
}

const FIELD_TO_COLUMN: Record<keyof Profile, string> = {
  userId: "user_id",
  role: "role",
  subject: "subject",
  gradeBand: "grade_band",
  confidenceUsing: "confidence_using",
  confidenceTrust: "confidence_trust",
  attitude: "attitude",
  reminderTime: "reminder_time",
  onboardedAt: "onboarded_at",
  alias: "alias",
  displayName: "display_name",
  referralCode: "referral_code",
  referredBy: "referred_by",
};

export function rowToProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    role: row.role,
    subject: row.subject,
    gradeBand: row.grade_band,
    confidenceUsing: row.confidence_using,
    confidenceTrust: row.confidence_trust,
    attitude: row.attitude as Attitude | null,
    reminderTime: row.reminder_time,
    onboardedAt: row.onboarded_at,
    alias: row.alias ?? null,
    displayName: row.display_name ?? null,
    referralCode: row.referral_code ?? null,
    referredBy: row.referred_by ?? null,
  };
}

/** Maps a partial Profile to a snake_case row, dropping undefined keys. */
export function profileToRow(patch: Partial<Profile>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      row[FIELD_TO_COLUMN[key as keyof Profile]] = value;
    }
  }
  return row;
}

export function isOnboardingComplete(p: Profile | null): boolean {
  return Boolean(p && p.role && p.subject && p.gradeBand && p.onboardedAt);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/data/mappers.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/data/types.ts lib/data/mappers.ts lib/data/mappers.test.ts
git commit -m "Add referralCode/referredBy to the Profile type and mappers"
```

---

### Task 3: Referral code generator + lookup by code

**Files:**
- Create: `lib/referral/code.ts`
- Test: `lib/referral/code.test.ts`
- Modify: `lib/data/profile.ts`
- Test: `lib/data/profile.test.ts`

**Interfaces:**
- Consumes: `Profile`, `ProfileRow`, `rowToProfile` (Task 2), `createServerClient` (existing).
- Produces: `generateReferralCode(): string` and `getProfileByReferralCode(code: string): Promise<Profile | null>` — consumed by Task 4 (generator) and Task 5 (lookup).

- [ ] **Step 1: Write the failing tests**

`lib/referral/code.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateReferralCode } from "./code";

describe("generateReferralCode", () => {
  it("returns an 8-character code using only unambiguous uppercase letters and digits", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });

  it("is not the same on every call", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
```

`lib/data/profile.test.ts` (new file — no test currently exists for
`lib/data/profile.ts`):

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ from: (t: string) => from(t) }),
}));

import { getProfileByReferralCode } from "./profile";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfileByReferralCode", () => {
  it("returns the matching profile", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        user_id: "referrer-1",
        role: null,
        subject: null,
        grade_band: null,
        confidence_using: null,
        confidence_trust: null,
        attitude: null,
        reminder_time: null,
        onboarded_at: null,
        referral_code: "ABCD1234",
      },
    });
    const p = await getProfileByReferralCode("ABCD1234");
    expect(p?.userId).toBe("referrer-1");
    expect(from).toHaveBeenCalledWith("profiles");
    expect(eq).toHaveBeenCalledWith("referral_code", "ABCD1234");
  });

  it("returns null when no profile has that code", async () => {
    maybeSingle.mockResolvedValue({ data: null });
    const p = await getProfileByReferralCode("NOPE0000");
    expect(p).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/referral/code.test.ts lib/data/profile.test.ts`
Expected: FAIL — `lib/referral/code.ts` doesn't exist yet; `getProfileByReferralCode` isn't exported from `lib/data/profile.ts` yet.

- [ ] **Step 3: Write minimal implementation**

`lib/referral/code.ts`:

```ts
// Excludes visually ambiguous characters (I, O, 0, 1) so a code read aloud
// or typed by hand is unambiguous.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
```

In `lib/data/profile.ts`, add `getProfileByReferralCode` (keep the
existing `getProfile`/`upsertProfile` exactly as they are):

```ts
export async function getProfileByReferralCode(
  code: string,
): Promise<Profile | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("referral_code", code)
    .maybeSingle();
  return data ? rowToProfile(data as ProfileRow) : null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/referral/code.test.ts lib/data/profile.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/referral/code.ts lib/referral/code.test.ts lib/data/profile.ts lib/data/profile.test.ts
git commit -m "Add referral code generator and lookup-by-code"
```

---

### Task 4: `getOrCreateReferralCode` and `logReferralShare` server actions

**Files:**
- Create: `app/actions/referral.ts`
- Test: `app/actions/referral.test.ts`

**Interfaces:**
- Consumes: `getSessionUser` (existing), `getProfile`/`upsertProfile` (existing), `generateReferralCode` (Task 3), `logEvent` (existing).
- Produces: `getOrCreateReferralCode(): Promise<string>`, `logReferralShare(): Promise<void>` — both consumed by Task 6 (`ShareApp`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionUser = vi.fn();
const getProfile = vi.fn();
const upsertProfile = vi.fn();
const generateReferralCode = vi.fn();
const logEvent = vi.fn();

vi.mock("@/lib/auth", () => ({ getSessionUser: () => getSessionUser() }));
vi.mock("@/lib/data/profile", () => ({
  getProfile: (id: string) => getProfile(id),
  upsertProfile: (id: string, patch: unknown) => upsertProfile(id, patch),
}));
vi.mock("@/lib/referral/code", () => ({
  generateReferralCode: () => generateReferralCode(),
}));
vi.mock("@/lib/data/events", () => ({
  logEvent: (n: string, p?: unknown) => logEvent(n, p),
}));

import { getOrCreateReferralCode, logReferralShare } from "./referral";

beforeEach(() => {
  vi.clearAllMocks();
  getSessionUser.mockResolvedValue({ id: "u1", email: "e", name: "n" });
});

describe("getOrCreateReferralCode", () => {
  it("returns the existing code without generating a new one", async () => {
    getProfile.mockResolvedValue({ referralCode: "EXIST123" });
    const code = await getOrCreateReferralCode();
    expect(code).toBe("EXIST123");
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("generates and persists a new code when none exists", async () => {
    getProfile.mockResolvedValue(null);
    generateReferralCode.mockReturnValue("NEWCODE1");
    upsertProfile.mockResolvedValue({ referralCode: "NEWCODE1" });
    const code = await getOrCreateReferralCode();
    expect(code).toBe("NEWCODE1");
    expect(upsertProfile).toHaveBeenCalledWith("u1", { referralCode: "NEWCODE1" });
  });

  it("retries once on a unique-constraint collision", async () => {
    getProfile.mockResolvedValue(null);
    generateReferralCode
      .mockReturnValueOnce("COLLIDE1")
      .mockReturnValueOnce("UNIQUE01");
    upsertProfile
      .mockRejectedValueOnce(new Error("duplicate key"))
      .mockResolvedValueOnce({ referralCode: "UNIQUE01" });
    const code = await getOrCreateReferralCode();
    expect(code).toBe("UNIQUE01");
    expect(upsertProfile).toHaveBeenCalledTimes(2);
  });
});

describe("logReferralShare", () => {
  it("logs a referral_link_shared event", async () => {
    await logReferralShare();
    expect(logEvent).toHaveBeenCalledWith("referral_link_shared");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/actions/referral.test.ts`
Expected: FAIL — `app/actions/referral.ts` doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
"use server";

import { getSessionUser } from "@/lib/auth";
import { getProfile, upsertProfile } from "@/lib/data/profile";
import { generateReferralCode } from "@/lib/referral/code";
import { logEvent } from "@/lib/data/events";

/** Returns the caller's existing referral code, generating one on first use. */
export async function getOrCreateReferralCode(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");

  const existing = await getProfile(user.id);
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const updated = await upsertProfile(user.id, {
        referralCode: generateReferralCode(),
      });
      if (updated.referralCode) return updated.referralCode;
    } catch {
      // Unique-constraint collision — practically never at 8 random
      // characters, but retry once rather than fail outright.
    }
  }
  throw new Error("Could not generate a referral code");
}

export async function logReferralShare(): Promise<void> {
  await logEvent("referral_link_shared");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/actions/referral.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add app/actions/referral.ts app/actions/referral.test.ts
git commit -m "Add getOrCreateReferralCode and logReferralShare server actions"
```

---

### Task 5: `/r/[code]` referral-link route

**Files:**
- Create: `app/r/[code]/route.ts`
- Test: `app/r/[code]/route.test.ts`

**Interfaces:**
- Consumes: `getProfileByReferralCode` (Task 3).
- Produces: sets the `referred_by` cookie (name and shape) consumed by Task 6.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getProfileByReferralCode = vi.fn();

vi.mock("@/lib/data/profile", () => ({
  getProfileByReferralCode: (c: string) => getProfileByReferralCode(c),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /r/[code]", () => {
  it("sets the referred_by cookie and redirects to /login when the code resolves", async () => {
    getProfileByReferralCode.mockResolvedValue({ userId: "referrer-1" });
    const res = await GET(new Request("https://app.test/r/ABCD1234"), {
      params: Promise.resolve({ code: "ABCD1234" }),
    });
    expect(res.headers.get("location")).toBe("https://app.test/login");
    expect(res.cookies.get("referred_by")?.value).toBe("referrer-1");
  });

  it("redirects to /login without setting a cookie for an unknown code", async () => {
    getProfileByReferralCode.mockResolvedValue(null);
    const res = await GET(new Request("https://app.test/r/NOPE0000"), {
      params: Promise.resolve({ code: "NOPE0000" }),
    });
    expect(res.headers.get("location")).toBe("https://app.test/login");
    expect(res.cookies.get("referred_by")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run "app/r/[code]/route.test.ts"`
Expected: FAIL — `app/r/[code]/route.ts` doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
import { NextResponse } from "next/server";
import { getProfileByReferralCode } from "@/lib/data/profile";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { origin } = new URL(request.url);
  const { code } = await params;
  const referrer = await getProfileByReferralCode(code);

  const response = NextResponse.redirect(`${origin}/login`);
  if (referrer) {
    response.cookies.set("referred_by", referrer.userId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return response;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/r/[code]/route.test.ts"`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add "app/r/[code]/route.ts" "app/r/[code]/route.test.ts"
git commit -m "Add /r/[code] referral link route"
```

---

### Task 6: Capture referral attribution in the OAuth callback

**Files:**
- Modify: `app/auth/callback/route.ts`
- Test: `app/auth/callback/route.test.ts`

**Interfaces:**
- Consumes: the `referred_by` cookie (Task 5), `getProfile`/`upsertProfile` (existing), `logEvent` (existing).
- Produces: no new interface — this is the terminal consumer of the referral cookie.

The current file is:

```ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/** OAuth callback: exchange the code for a session, then continue into the app. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const exchangeCodeForSession = vi.fn();
const get = vi.fn();
const del = vi.fn();
const getProfile = vi.fn();
const upsertProfile = vi.fn();
const logEvent = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    auth: { exchangeCodeForSession: (c: string) => exchangeCodeForSession(c) },
  }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get, delete: del }),
}));
vi.mock("@/lib/data/profile", () => ({
  getProfile: (id: string) => getProfile(id),
  upsertProfile: (id: string, patch: unknown) => upsertProfile(id, patch),
}));
vi.mock("@/lib/data/events", () => ({
  logEvent: (n: string, p?: unknown) => logEvent(n, p),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockResolvedValue({
    data: { user: { id: "new-user" } },
    error: null,
  });
  get.mockReturnValue(undefined);
  getProfile.mockResolvedValue(null);
});

describe("auth callback", () => {
  it("redirects to next on successful auth with no referral cookie pending", async () => {
    const res = await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(res.headers.get("location")).toBe("https://app.test/");
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("attributes the referral for a genuinely new user with a pending cookie", async () => {
    get.mockReturnValue({ value: "referrer-1" });
    await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(upsertProfile).toHaveBeenCalledWith("new-user", { referredBy: "referrer-1" });
    expect(logEvent).toHaveBeenCalledWith("referral_signup", { referredBy: "referrer-1" });
    expect(del).toHaveBeenCalledWith("referred_by");
  });

  it("does not attribute referral for a user who already has a profile", async () => {
    get.mockReturnValue({ value: "referrer-1" });
    getProfile.mockResolvedValue({ userId: "new-user" });
    await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("guards against a self-referral", async () => {
    get.mockReturnValue({ value: "new-user" });
    await GET(new Request("https://app.test/auth/callback?code=abc"));
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=auth when the code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: {},
      error: { message: "bad code" },
    });
    const res = await GET(new Request("https://app.test/auth/callback?code=bad"));
    expect(res.headers.get("location")).toBe("https://app.test/login?error=auth");
    expect(upsertProfile).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/auth/callback/route.test.ts`
Expected: FAIL — the first test (no cookie) passes already since it
matches current behavior, but the referral-attribution tests fail since
none of that logic exists yet.

- [ ] **Step 3: Write minimal implementation**

Replace the whole file with:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { getProfile, upsertProfile } from "@/lib/data/profile";
import { logEvent } from "@/lib/data/events";

/** OAuth callback: exchange the code for a session, then continue into the app. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await captureReferral(data.user.id);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

/**
 * If a referral cookie is pending and this is a genuinely new user
 * (no profile row yet), attribute the signup and clear the cookie.
 * Never overwrites an existing user's referred_by, and never lets a
 * user be attributed as their own referrer.
 */
async function captureReferral(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const referredBy = cookieStore.get("referred_by")?.value;
  if (!referredBy || referredBy === userId) return;

  const existing = await getProfile(userId);
  if (existing) return;

  await upsertProfile(userId, { referredBy });
  await logEvent("referral_signup", { referredBy });
  cookieStore.delete("referred_by");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/auth/callback/route.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add app/auth/callback/route.ts app/auth/callback/route.test.ts
git commit -m "Capture referral attribution in the OAuth callback"
```

---

### Task 7: `ShareApp` component

**Files:**
- Create: `components/share/ShareApp.tsx`
- Test: `components/share/ShareApp.test.tsx`

**Interfaces:**
- Consumes: `getOrCreateReferralCode`, `logReferralShare` (Task 4).
- Produces: `ShareApp()` (no props) — consumed by Tasks 8 and 9.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareApp } from "./ShareApp";

const getOrCreateReferralCode = vi.fn();
const logReferralShare = vi.fn();

vi.mock("@/app/actions/referral", () => ({
  getOrCreateReferralCode: () => getOrCreateReferralCode(),
  logReferralShare: () => logReferralShare(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getOrCreateReferralCode.mockResolvedValue("ABCD1234");
  logReferralShare.mockResolvedValue(undefined);
});

describe("ShareApp", () => {
  it("renders the referral link and a correctly-encoded WhatsApp share link", async () => {
    render(<ShareApp />);
    await waitFor(() => screen.getByText(/\/r\/ABCD1234/));
    const link = screen.getByRole("link", { name: "Share on WhatsApp" });
    const href = link.getAttribute("href")!;
    expect(href).toContain("https://wa.me/?text=");
    expect(decodeURIComponent(href.split("?text=")[1])).toContain("/r/ABCD1234");
  });

  it("logs a share event when the WhatsApp link is clicked", async () => {
    render(<ShareApp />);
    await waitFor(() => screen.getByRole("link", { name: "Share on WhatsApp" }));
    fireEvent.click(screen.getByRole("link", { name: "Share on WhatsApp" }));
    expect(logReferralShare).toHaveBeenCalled();
  });

  it("renders nothing before the code has loaded", () => {
    getOrCreateReferralCode.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<ShareApp />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/share/ShareApp.test.tsx`
Expected: FAIL — `components/share/ShareApp.tsx` doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
"use client";

import { useEffect, useState } from "react";
import { getOrCreateReferralCode, logReferralShare } from "@/app/actions/referral";

export function ShareApp() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await getOrCreateReferralCode();
      if (!cancelled) setCode(c);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!code) return null;

  const link = `${window.location.origin}/r/${code}`;
  const message = `I've been using SahajAiVidya to make worksheets and quizzes in minutes instead of hours — thought you'd like it too: ${link}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-line bg-surface p-4 shadow-[var(--elev-1)]">
      <p className="text-[13px] font-bold text-ink">
        Know a teacher who&apos;d love this?
      </p>
      <p className="truncate text-[12px] text-muted">{link}</p>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          void logReferralShare();
        }}
        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-gradient-to-b from-accent to-brand px-6 py-3 text-[15px] font-extrabold tracking-tight text-[color:var(--gold-soft)] shadow-[var(--glow-gold)] transition hover:brightness-105"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/share/ShareApp.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/share/ShareApp.tsx components/share/ShareApp.test.tsx
git commit -m "Add ShareApp component (referral link + WhatsApp share)"
```

---

### Task 8: Wire `ShareApp` into the You tab

**Files:**
- Modify: `components/you/YouProfile.tsx`

**Interfaces:**
- Consumes: `ShareApp` (Task 7).

- [ ] **Step 1: Write the failing test**

Create `components/you/YouProfile.test.tsx` (no test currently exists
for this component):

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { YouProfile } from "./YouProfile";

vi.mock("@/app/actions/referral", () => ({
  getOrCreateReferralCode: vi.fn(() => new Promise(() => {})),
  logReferralShare: vi.fn(),
}));

const baseProps = {
  firstName: "Asha",
  confidence: 60,
  xp: 100,
  streak: 3,
  badges: [],
  league: [],
  daysLeft: 2,
  isAdmin: false,
  setAlias: vi.fn(),
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
};

describe("YouProfile", () => {
  it("renders the share prompt", () => {
    render(<YouProfile {...baseProps} />);
    expect(screen.getByText("Know a teacher who'd love this?")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/you/YouProfile.test.tsx`
Expected: FAIL — `ShareApp` isn't rendered by `YouProfile` yet.

- [ ] **Step 3: Write minimal implementation**

Add the import:

```tsx
import { ShareApp } from "@/components/share/ShareApp";
```

In the JSX, add a new section right after the league `<section>` and
before the `setAlias` `<form>`:

```tsx
      <section className="flex flex-col gap-3">
        <SectionLabel>Share SahajAiVidya</SectionLabel>
        <ShareApp />
      </section>

      <form action={setAlias} className="flex gap-2">
```

(This is the only change — the existing league section, alias form, and
everything in the `mt-auto` footer block stay exactly as they are.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/you/YouProfile.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add components/you/YouProfile.tsx components/you/YouProfile.test.tsx
git commit -m "Add Share SahajAiVidya section to the You tab"
```

---

### Task 9: Wire `ShareApp` into the lesson-complete moment

**Files:**
- Modify: `components/lesson/LessonComplete.tsx`

**Interfaces:**
- Consumes: `ShareApp` (Task 7).

The current standard lesson-complete branch (the badge-unlock branch
above it is untouched) is:

```tsx
  return (
    <main className="flex min-h-full flex-col p-6">
      <RewardMoment
        kicker="Lesson complete"
        title="That's another one down."
        primaryLabel={nextHref ? "Next lesson" : "Back to Learn"}
        onPrimary={goNext}
        secondaryLabel={nextHref ? "Back to Learn" : undefined}
        onSecondary={nextHref ? () => router.push("/learn") : undefined}
      >
        {score < 100
          ? "Nice work — review anytime to sharpen up."
          : "Nice work — perfect run."}
      </RewardMoment>
    </main>
  );
```

- [ ] **Step 1: Write the failing test**

Create `components/lesson/LessonComplete.test.tsx` (no test currently
exists for this component):

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonComplete } from "./LessonComplete";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/referral", () => ({
  getOrCreateReferralCode: vi.fn(() => new Promise(() => {})),
  logReferralShare: vi.fn(),
}));

describe("LessonComplete", () => {
  it("shows the share prompt on the standard lesson-complete moment", () => {
    render(<LessonComplete score={100} nextHref="/lesson/next" />);
    expect(screen.getByText("Know a teacher who'd love this?")).toBeInTheDocument();
  });

  it("does not show the share prompt on the badge-unlock moment", () => {
    render(
      <LessonComplete
        score={100}
        nextHref="/lesson/next"
        newBadges={[{ id: "b1", label: "First Win", emoji: "🏅" }]}
      />,
    );
    expect(screen.queryByText("Know a teacher who'd love this?")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/lesson/LessonComplete.test.tsx`
Expected: FAIL — the first test fails (`ShareApp` isn't rendered yet);
the second passes already (badge-unlock branch never touches `ShareApp`).

- [ ] **Step 3: Write minimal implementation**

Add the import:

```tsx
import { ShareApp } from "@/components/share/ShareApp";
```

Change the standard lesson-complete branch's `RewardMoment` children
from a single string expression to a fragment containing both the
existing text and `ShareApp`:

```tsx
      <RewardMoment
        kicker="Lesson complete"
        title="That's another one down."
        primaryLabel={nextHref ? "Next lesson" : "Back to Learn"}
        onPrimary={goNext}
        secondaryLabel={nextHref ? "Back to Learn" : undefined}
        onSecondary={nextHref ? () => router.push("/learn") : undefined}
      >
        <>
          {score < 100
            ? "Nice work — review anytime to sharpen up."
            : "Nice work — perfect run."}
          <div className="mt-4">
            <ShareApp />
          </div>
        </>
      </RewardMoment>
```

(The badge-unlock branch above this, which renders its own separate
`RewardMoment` with no `children`, is untouched.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/lesson/LessonComplete.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/lesson/LessonComplete.tsx components/lesson/LessonComplete.test.tsx
git commit -m "Add share prompt to the lesson-complete moment"
```

---

## Final verification (after all 9 tasks)

- [ ] Run the full suite: `npx vitest run` — expect all tests passing
  (pre-plan baseline was 294; this plan adds tests in Tasks 2-9).
- [ ] `npx tsc --noEmit` — clean.
- [ ] `npm run lint` — clean (same pre-existing warning count as baseline).
- [ ] Manually verify in a browser against the dev server: open the You
  tab, confirm the Share section renders a link and a working "Share on
  WhatsApp" button (opens `wa.me` with the link pre-filled); complete a
  lesson and confirm the same prompt appears on the lesson-complete
  screen; visit `/r/<your-code>` in a fresh/incognito session and confirm
  it redirects to `/login` (full signup-attribution round-trip requires a
  second real Google account, which is out of scope to fabricate in this
  step — visually confirming the redirect and cookie being set, e.g. via
  browser dev tools, is sufficient).
