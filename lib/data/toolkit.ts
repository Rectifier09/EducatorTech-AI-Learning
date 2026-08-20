import type { PlaygroundSession } from "./types";

interface PlaygroundRow {
  id: string;
  user_id: string;
  lesson_id: string | null;
  artifact_type: string | null;
  prompt: string;
  output: string;
  saved_to_toolkit: boolean;
  created_at: string;
}

export interface SavedArtifact extends PlaygroundSession {
  id: string;
}

function rowToArtifact(row: PlaygroundRow): SavedArtifact {
  return {
    id: row.id,
    userId: row.user_id,
    lessonId: row.lesson_id,
    artifactType: row.artifact_type,
    prompt: row.prompt,
    output: row.output,
    savedToToolkit: row.saved_to_toolkit,
    createdAt: row.created_at,
  };
}

function cap(s: string): string {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Short human title for a saved artifact. Pure. */
export function artifactTitle(
  session: Pick<PlaygroundSession, "artifactType" | "prompt" | "createdAt">,
): string {
  const m = session.prompt.match(/\bon\s+(.+?)(?:\s+for\b|[,.\n]|$)/i);
  const topic = m ? cap(m[1]) : null;
  if (session.artifactType) {
    return topic ? `${session.artifactType} · ${topic}` : session.artifactType;
  }
  if (topic) return topic;
  const d = new Date(session.createdAt);
  return `Creation · ${d.toLocaleDateString()}`;
}

export async function saveArtifact(
  userId: string,
  input: {
    lessonId?: string | null;
    artifactType?: string | null;
    prompt: string;
    output: string;
  },
): Promise<string> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("playground_sessions")
    .insert({
      user_id: userId,
      lesson_id: input.lessonId ?? null,
      artifact_type: input.artifactType ?? null,
      prompt: input.prompt,
      output: input.output,
      saved_to_toolkit: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** The user's most recent playground output (saved or not) — the artifact spine. */
export async function getLatestArtifact(
  userId: string,
): Promise<string | null> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("playground_sessions")
    .select("output")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.output as string | undefined) ?? null;
}

export async function listArtifacts(userId: string): Promise<SavedArtifact[]> {
  const { createServerClient } = await import("@/lib/supabase/server");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("playground_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("saved_to_toolkit", true)
    .order("created_at", { ascending: false });
  return ((data ?? []) as PlaygroundRow[]).map(rowToArtifact);
}
