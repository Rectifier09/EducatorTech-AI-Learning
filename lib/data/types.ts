// App-level data types (camelCase). The lib/data layer maps these
// to/from the snake_case Postgres rows.

export type Attitude = "excited" | "curious" | "cautious" | "skeptical";

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
}

export type SurveyPhase = "pre" | "post";

export interface SurveyResponse {
  userId: string;
  phase: SurveyPhase;
  usingScore: number;
  trustScore: number;
  attitude: Attitude;
  createdAt: string;
}

export type ProgressStatus = "locked" | "active" | "completed";

export interface LessonProgress {
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  score: number | null;
  attempts: number;
  completedAt: string | null;
}

export interface AppEvent {
  userId: string;
  name: string;
  props: Record<string, unknown>;
  createdAt: string;
}

export interface PlaygroundSession {
  userId: string;
  lessonId: string | null;
  artifactType: string | null;
  prompt: string;
  output: string;
  savedToToolkit: boolean;
  createdAt: string;
}
