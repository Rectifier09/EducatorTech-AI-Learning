import { confidenceDelta } from "./delta";
import { FOUNDATIONS_TRACK_ID } from "@/lib/content/loader";
import type { Attitude } from "@/lib/data/types";
import { computeStreak, activeDatesFromEvents } from "@/lib/gamification/streak";

export interface ProfileRow {
  user_id: string;
  onboarded_at: string | null;
  /** Optional: only populated by callers that fetched it (Acquisition/Referral
   *  sections). Missing or null both mean "not referred" (organic). */
  referred_by?: string | null;
}
export interface ProgressRow {
  user_id: string;
  lesson_id: string;
  status: string;
}
export interface EventRow {
  user_id: string;
  name: string;
  created_at: string;
  /** jsonb payload — trackId/lessonId/value etc. Optional so callers that only
   *  need name/user_id (e.g. activationCounts) can omit it. */
  props?: Record<string, unknown>;
}
export interface SurveyRow {
  user_id: string;
  phase: "pre" | "post";
  using_score: number;
  trust_score: number;
  attitude: Attitude;
}

/** Activation funnel counts. */
export function activationCounts(input: {
  profiles: ProfileRow[];
  progress: ProgressRow[];
  events: EventRow[];
}): {
  onboarded: number;
  completedL1: number;
  smallWin: number;
  completedTrack: number;
} {
  const completedFor = (lessonId: string) =>
    new Set(
      input.progress
        .filter((p) => p.lesson_id === lessonId && p.status === "completed")
        .map((p) => p.user_id),
    );

  // Phase-2 namespaced progress ids to "<trackId>:<lessonId>", so the funnel
  // must match the foundations track's namespaced keys (previously bare "l1"
  // etc., which undercounted to zero).
  const ns = (lessonId: string) => `${FOUNDATIONS_TRACK_ID}:${lessonId}`;

  const smallWinUsers = new Set<string>([
    ...completedFor(ns("l4")),
    ...input.events.filter((e) => e.name === "artifact_saved").map((e) => e.user_id),
  ]);

  return {
    onboarded: input.profiles.filter((p) => p.onboarded_at).length,
    completedL1: completedFor(ns("l1")).size,
    smallWin: smallWinUsers.size,
    completedTrack: completedFor(ns("l7")).size,
  };
}

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

/** Mean using/trust confidence change across users with both surveys. */
export function avgConfidenceDelta(rows: SurveyRow[]): {
  n: number;
  avgUsingDelta: number;
  avgTrustDelta: number;
} {
  const byUser = new Map<string, { pre?: SurveyRow; post?: SurveyRow }>();
  for (const r of rows) {
    const e = byUser.get(r.user_id) ?? {};
    e[r.phase] = r;
    byUser.set(r.user_id, e);
  }
  const deltas = [...byUser.values()]
    .filter((e) => e.pre && e.post)
    .map((e) =>
      confidenceDelta(
        {
          usingScore: e.pre!.using_score,
          trustScore: e.pre!.trust_score,
          attitude: e.pre!.attitude,
        },
        {
          usingScore: e.post!.using_score,
          trustScore: e.post!.trust_score,
          attitude: e.post!.attitude,
        },
      ),
    );
  const n = deltas.length;
  if (n === 0) return { n: 0, avgUsingDelta: 0, avgTrustDelta: 0 };
  const sum = (f: (d: (typeof deltas)[number]) => number) =>
    deltas.reduce((s, d) => s + f(d), 0);
  return {
    n,
    avgUsingDelta: Math.round((sum((d) => d.usingDelta) / n) * 10) / 10,
    avgTrustDelta: Math.round((sum((d) => d.trustDelta) / n) * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// A — Pilot success (journey-aware)
// ---------------------------------------------------------------------------

/** A live track fed into the journey funnel. */
export interface TrackInput {
  trackId: string;
  title: string;
  lessonIds: string[];
}

export interface LessonFunnel {
  lessonId: string;
  started: number;
  completed: number;
  /** % of this lesson's starters who did NOT complete it. */
  dropoffPct: number;
}

export interface JourneyFunnel {
  trackId: string;
  title: string;
  started: number;
  completed: number;
  /** % of track starters who completed the LAST lesson. */
  completionPct: number;
  lessons: LessonFunnel[];
}

const pct = (num: number, den: number) =>
  den > 0 ? Math.min(100, Math.round((num / den) * 100)) : 0;

/**
 * Per-journey started → completed funnel, distinct users at each step.
 *
 * - `started` (track & per-lesson) = distinct users with a `lesson_started`
 *   event carrying the matching `props.trackId` (+ `props.lessonId` per lesson).
 * - `completed` (track) = distinct users who completed the track's LAST lesson,
 *   read from `progress` at the namespaced key `"<trackId>:<lastLessonId>"`.
 * - `completed` (per-lesson) = distinct users with that lesson's namespaced
 *   progress row at status "completed".
 *
 * Pure: derives everything from the passed rows; no I/O.
 */
export function journeyFunnel(input: {
  tracks: TrackInput[];
  progress: ProgressRow[];
  events: EventRow[];
}): JourneyFunnel[] {
  // completed-users set per namespaced progress key
  const completedByKey = new Map<string, Set<string>>();
  for (const p of input.progress) {
    if (p.status !== "completed") continue;
    let s = completedByKey.get(p.lesson_id);
    if (!s) completedByKey.set(p.lesson_id, (s = new Set()));
    s.add(p.user_id);
  }

  // started-users set per "trackId" and per "trackId::lessonId" from events
  const startedByTrack = new Map<string, Set<string>>();
  const startedByLesson = new Map<string, Set<string>>();
  for (const e of input.events) {
    if (e.name !== "lesson_started") continue;
    const trackId = e.props?.trackId as string | undefined;
    const lessonId = e.props?.lessonId as string | undefined;
    if (!trackId) continue;
    let t = startedByTrack.get(trackId);
    if (!t) startedByTrack.set(trackId, (t = new Set()));
    t.add(e.user_id);
    if (lessonId) {
      const k = `${trackId}::${lessonId}`;
      let l = startedByLesson.get(k);
      if (!l) startedByLesson.set(k, (l = new Set()));
      l.add(e.user_id);
    }
  }

  return input.tracks.map((track) => {
    const lastLessonId = track.lessonIds[track.lessonIds.length - 1];
    const started = startedByTrack.get(track.trackId)?.size ?? 0;
    const completed =
      completedByKey.get(`${track.trackId}:${lastLessonId}`)?.size ?? 0;

    const lessons: LessonFunnel[] = track.lessonIds.map((lessonId) => {
      const ls = startedByLesson.get(`${track.trackId}::${lessonId}`)?.size ?? 0;
      const lc =
        completedByKey.get(`${track.trackId}:${lessonId}`)?.size ?? 0;
      return {
        lessonId,
        started: ls,
        completed: lc,
        dropoffPct: pct(Math.max(ls - lc, 0), ls),
      };
    });

    return {
      trackId: track.trackId,
      title: track.title,
      started,
      completed,
      completionPct: pct(completed, started),
      lessons,
    };
  });
}

// ---------------------------------------------------------------------------
// B — Content quality
// ---------------------------------------------------------------------------

export interface ReflectionStat {
  avg: number;
  n: number;
}

/** Below this (of 5) a lesson's reflection reads as "confusing". */
export const LOW_REFLECTION_THRESHOLD = 3;

/**
 * Mean of `confidence_check.props.value` (1–5) per lesson, keyed
 * `"<trackId>:<lessonId>"` to line up with the journey funnel. Events that
 * predate trackId instrumentation (no `props.trackId`) fall back to a bare
 * `"<lessonId>"` key so they still surface, just un-joined to a track.
 */
export function reflectionValueByLesson(
  events: EventRow[],
): Map<string, ReflectionStat> {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const e of events) {
    if (e.name !== "confidence_check") continue;
    const value = e.props?.value;
    if (typeof value !== "number") continue;
    const lessonId = e.props?.lessonId as string | undefined;
    if (!lessonId) continue;
    const trackId = e.props?.trackId as string | undefined;
    const key = trackId ? `${trackId}:${lessonId}` : lessonId;
    const cur = sums.get(key) ?? { sum: 0, n: 0 };
    cur.sum += value;
    cur.n += 1;
    sums.set(key, cur);
  }
  const out = new Map<string, ReflectionStat>();
  for (const [key, { sum, n }] of sums) {
    out.set(key, { avg: Math.round((sum / n) * 10) / 10, n });
  }
  return out;
}

export interface LessonHealth {
  trackId: string;
  lessonId: string;
  /** Higher = more in need of review. */
  concern: number;
  started: number;
  dropoffPct: number;
  reflectionAvg: number | null;
  reflectionN: number;
  reason: string;
}

/**
 * Ranked "review next" list. Concern combines:
 *  - traffic-weighted drop-off = users lost = started * dropoffPct/100, and
 *  - low reflection = (threshold - avg) * n when avg is below the threshold.
 * Lessons with zero concern are dropped; the top `limit` (default 8) remain.
 * Pure: derives from the journey funnel + reflection map only.
 */
export function lessonHealthRanking(input: {
  journeys: JourneyFunnel[];
  reflection: Map<string, ReflectionStat>;
  limit?: number;
}): LessonHealth[] {
  const limit = input.limit ?? 8;
  const rows: LessonHealth[] = [];

  for (const j of input.journeys) {
    for (const l of j.lessons) {
      const key = `${j.trackId}:${l.lessonId}`;
      const r = input.reflection.get(key) ?? null;

      const usersLost = (l.started * l.dropoffPct) / 100;
      const lowReflection =
        r && r.avg < LOW_REFLECTION_THRESHOLD
          ? (LOW_REFLECTION_THRESHOLD - r.avg) * r.n
          : 0;
      const concern = Math.round((usersLost + lowReflection) * 10) / 10;
      if (concern <= 0) continue;

      const reasons: string[] = [];
      if (usersLost > 0) {
        reasons.push(`${l.dropoffPct}% drop-off of ${l.started} starters`);
      }
      if (lowReflection > 0 && r) {
        reasons.push(`low reflection ${r.avg}/5 (n=${r.n})`);
      }

      rows.push({
        trackId: j.trackId,
        lessonId: l.lessonId,
        concern,
        started: l.started,
        dropoffPct: l.dropoffPct,
        reflectionAvg: r?.avg ?? null,
        reflectionN: r?.n ?? 0,
        reason: reasons.join(" · "),
      });
    }
  }

  return rows.sort((a, b) => b.concern - a.concern).slice(0, limit);
}

/** "Notify me" taps per skill-tree node, most-wanted first. */
export function notifyDemand(
  rows: { node_id: string }[],
): { nodeId: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.node_id, (counts.get(r.node_id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([nodeId, count]) => ({ nodeId, count }))
    .sort((a, b) => b.count - a.count);
}
