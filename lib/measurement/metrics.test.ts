import { describe, it, expect } from "vitest";
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
import { isAdmin } from "@/lib/admin";

describe("measurement metrics", () => {
  it("activationCounts uses namespaced foundations ids", () => {
    const c = activationCounts({
      profiles: [
        { user_id: "a", onboarded_at: "now" },
        { user_id: "b", onboarded_at: "now" },
        { user_id: "c", onboarded_at: null },
      ],
      progress: [
        // namespaced "<trackId>:<lessonId>" keys (Phase-2). Bare "l1" must NOT count.
        { user_id: "a", lesson_id: "ai-foundations:l1", status: "completed" },
        { user_id: "a", lesson_id: "ai-foundations:l7", status: "completed" },
        { user_id: "b", lesson_id: "ai-foundations:l1", status: "completed" },
        { user_id: "b", lesson_id: "l1", status: "completed" },
      ],
      events: [{ user_id: "a", name: "artifact_saved", created_at: "now" }],
    });
    expect(c).toEqual({
      onboarded: 2,
      completedL1: 2,
      smallWin: 1,
      completedTrack: 1,
    });
  });

  it("avgConfidenceDelta averages users who have both surveys", () => {
    const r = avgConfidenceDelta([
      { user_id: "a", phase: "pre", using_score: 1, trust_score: 1, attitude: "skeptical" },
      { user_id: "a", phase: "post", using_score: 3, trust_score: 3, attitude: "curious" },
      { user_id: "b", phase: "pre", using_score: 2, trust_score: 2, attitude: "cautious" },
    ]);
    expect(r.n).toBe(1);
    expect(r.avgUsingDelta).toBe(2);
  });

  it("notifyDemand ranks nodes by taps", () => {
    const d = notifyDemand([
      { node_id: "grading" },
      { node_id: "grading" },
      { node_id: "privacy" },
    ]);
    expect(d[0]).toEqual({ nodeId: "grading", count: 2 });
  });

  it("journeyFunnel dedupes started by user and reads namespaced completion", () => {
    const tracks = [
      { trackId: "ai-foundations", title: "Foundations", lessonIds: ["l1", "l2"] },
    ];
    const [j] = journeyFunnel({
      tracks,
      progress: [
        // user a completed the LAST lesson (l2) → track-complete
        { user_id: "a", lesson_id: "ai-foundations:l1", status: "completed" },
        { user_id: "a", lesson_id: "ai-foundations:l2", status: "completed" },
        { user_id: "b", lesson_id: "ai-foundations:l1", status: "completed" },
      ],
      events: [
        // a starts twice → deduped to one distinct user
        { user_id: "a", name: "lesson_started", created_at: "t", props: { trackId: "ai-foundations", lessonId: "l1" } },
        { user_id: "a", name: "lesson_started", created_at: "t", props: { trackId: "ai-foundations", lessonId: "l1" } },
        { user_id: "b", name: "lesson_started", created_at: "t", props: { trackId: "ai-foundations", lessonId: "l1" } },
        { user_id: "a", name: "lesson_started", created_at: "t", props: { trackId: "ai-foundations", lessonId: "l2" } },
        // different track — must be ignored here
        { user_id: "c", name: "lesson_started", created_at: "t", props: { trackId: "grading", lessonId: "l1" } },
      ],
    });
    expect(j.started).toBe(2); // a, b
    expect(j.completed).toBe(1); // only a finished l2
    expect(j.completionPct).toBe(50);
    const l1 = j.lessons.find((l) => l.lessonId === "l1")!;
    expect(l1).toEqual({ lessonId: "l1", started: 2, completed: 2, dropoffPct: 0 });
    const l2 = j.lessons.find((l) => l.lessonId === "l2")!;
    // 1 started l2, 1 completed → 0% drop
    expect(l2).toEqual({ lessonId: "l2", started: 1, completed: 1, dropoffPct: 0 });
  });

  it("reflectionValueByLesson averages props.value per track:lesson", () => {
    const m = reflectionValueByLesson([
      { user_id: "a", name: "confidence_check", created_at: "t", props: { trackId: "ai-foundations", lessonId: "l3", value: 2 } },
      { user_id: "b", name: "confidence_check", created_at: "t", props: { trackId: "ai-foundations", lessonId: "l3", value: 4 } },
      { user_id: "c", name: "confidence_check", created_at: "t", props: { trackId: "ai-foundations", lessonId: "l3", value: 3 } },
      // unrelated event ignored
      { user_id: "d", name: "artifact_saved", created_at: "t", props: {} },
    ]);
    expect(m.get("ai-foundations:l3")).toEqual({ avg: 3, n: 3 });
  });

  it("lessonHealthRanking ranks by traffic-weighted drop-off + low reflection", () => {
    const journeys = [
      {
        trackId: "ai-foundations",
        title: "Foundations",
        started: 10,
        completed: 4,
        completionPct: 40,
        lessons: [
          { lessonId: "l1", started: 10, completed: 5, dropoffPct: 50 }, // heavy drop
          { lessonId: "l2", started: 8, completed: 8, dropoffPct: 0 }, // healthy but low reflection
          { lessonId: "l3", started: 6, completed: 6, dropoffPct: 0 }, // clean
        ],
      },
    ];
    const reflection = new Map([
      ["ai-foundations:l2", { avg: 2, n: 5 }], // confusing
      ["ai-foundations:l3", { avg: 4.5, n: 4 }], // fine
    ]);
    const ranked = lessonHealthRanking({ journeys, reflection });
    // l1 concern = 10*50/100 = 5 ; l2 concern = (3-2)*5 = 5 ; l3 = 0 (dropped)
    expect(ranked.map((r) => r.lessonId)).toEqual(["l1", "l2"]);
    expect(ranked.every((r) => r.concern > 0)).toBe(true);
    expect(ranked.find((r) => r.lessonId === "l2")!.reason).toContain("low reflection");
  });

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

  it("isAdmin gates by the allow-list", () => {
    expect(isAdmin("prashantpps09@gmail.com")).toBe(true);
    expect(isAdmin("someone@else.com")).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});
