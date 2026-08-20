import type { Attitude } from "@/lib/data/types";

const ATTITUDE_ORDER: Attitude[] = [
  "skeptical",
  "cautious",
  "curious",
  "excited",
];

interface Scores {
  usingScore: number;
  trustScore: number;
  attitude: Attitude;
}

export interface ConfidenceDelta {
  usingDelta: number;
  trustDelta: number;
  attitudeShift: "up" | "same" | "down";
}

export function confidenceDelta(pre: Scores, post: Scores): ConfidenceDelta {
  const d =
    ATTITUDE_ORDER.indexOf(post.attitude) -
    ATTITUDE_ORDER.indexOf(pre.attitude);
  return {
    usingDelta: post.usingScore - pre.usingScore,
    trustDelta: post.trustScore - pre.trustScore,
    attitudeShift: d > 0 ? "up" : d < 0 ? "down" : "same",
  };
}
