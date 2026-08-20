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
