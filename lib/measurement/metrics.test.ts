import { describe, it, expect } from "vitest";
import { activationCounts, avgConfidenceDelta, notifyDemand } from "./metrics";
import { isAdmin } from "@/lib/admin";

describe("measurement metrics", () => {
  it("activationCounts computes the funnel", () => {
    const c = activationCounts({
      profiles: [
        { user_id: "a", onboarded_at: "now" },
        { user_id: "b", onboarded_at: "now" },
        { user_id: "c", onboarded_at: null },
      ],
      progress: [
        { user_id: "a", lesson_id: "l1", status: "completed" },
        { user_id: "a", lesson_id: "l7", status: "completed" },
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

  it("isAdmin gates by the allow-list", () => {
    expect(isAdmin("prashantpps09@gmail.com")).toBe(true);
    expect(isAdmin("someone@else.com")).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});
