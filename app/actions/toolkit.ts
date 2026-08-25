"use server";

import { getSessionUser } from "@/lib/auth";
import { saveArtifact, deleteArtifact } from "@/lib/data/toolkit";
import { logEvent } from "@/lib/data/events";

export async function saveToToolkit(input: {
  trackId?: string | null;
  lessonId?: string | null;
  artifactType?: string | null;
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  prompt: string;
  output: string;
}): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await saveArtifact(user.id, input);
  await logEvent("artifact_saved", {
    artifactType: input.artifactType ?? null,
    trackId: input.trackId ?? null,
    lessonId: input.lessonId ?? null,
  });
}

export async function deleteToolkitItem(id: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await deleteArtifact(user.id, id);
  await logEvent("artifact_deleted", { id });
}
