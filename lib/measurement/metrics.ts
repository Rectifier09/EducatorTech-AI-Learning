import { confidenceDelta } from "./delta";
import type { Attitude } from "@/lib/data/types";

export interface ProfileRow {
  user_id: string;
  onboarded_at: string | null;
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

  const smallWinUsers = new Set<string>([
    ...completedFor("l4"),
    ...input.events.filter((e) => e.name === "artifact_saved").map((e) => e.user_id),
  ]);

  return {
    onboarded: input.profiles.filter((p) => p.onboarded_at).length,
    completedL1: completedFor("l1").size,
    smallWin: smallWinUsers.size,
    completedTrack: completedFor("l7").size,
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
