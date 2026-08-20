import type { Lesson } from "@/lib/content/types";
import type { Profile } from "@/lib/data/types";

export interface SessionState {
  index: number;
  results: Record<string, boolean>;
  done: boolean;
  /** The artifact produced in a `make` playground block, carried to refine/verify (Phase 3). */
  spineArtifact?: string;
}

export function initSession(
  _lesson: Pick<Lesson, "blocks">,
  initialSpine?: string,
): SessionState {
  return { index: 0, results: {}, done: false, spineArtifact: initialSpine };
}

export function recordResult(
  state: SessionState,
  blockId: string,
  passed: boolean,
): SessionState {
  return { ...state, results: { ...state.results, [blockId]: passed } };
}

export function advance(state: SessionState, total: number): SessionState {
  const next = state.index + 1;
  if (next >= total) return { ...state, index: total, done: true };
  return { ...state, index: next };
}

export function setSpineArtifact(
  state: SessionState,
  artifact: string,
): SessionState {
  return { ...state, spineArtifact: artifact };
}

/** 0–100 = % of recorded (gradable) results that passed; 100 if none. */
export function computeScore(results: Record<string, boolean>): number {
  const vals = Object.values(results);
  if (vals.length === 0) return 100;
  const passed = vals.filter(Boolean).length;
  return Math.round((passed / vals.length) * 100);
}

export function personalize(
  text: string,
  profile: Pick<Profile, "subject" | "gradeBand">,
): string {
  const subject = profile.subject ?? "your class";
  const gradeBand = profile.gradeBand ?? "your";
  return text
    .replace(/\{\{subject\}\}/g, subject)
    .replace(/\{\{gradeBand\}\}/g, gradeBand);
}
