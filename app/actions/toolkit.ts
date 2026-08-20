"use server";

import { getSessionUser } from "@/lib/auth";
import { saveArtifact } from "@/lib/data/toolkit";
import { logEvent } from "@/lib/data/events";

export async function saveToToolkit(input: {
  lessonId?: string | null;
  artifactType?: string | null;
  prompt: string;
  output: string;
}): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  await saveArtifact(user.id, input);
  await logEvent("artifact_saved", {
    artifactType: input.artifactType ?? null,
    lessonId: input.lessonId ?? null,
  });
}
