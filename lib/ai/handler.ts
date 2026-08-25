import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { checkRateLimit } from "./rateLimit";
import { buildSystemPrompt, isLikelyOffTopic, type AiMode } from "./guardrails";
import { generate } from "./service";
import { logEvent } from "@/lib/data/events";
import { archetypeForArtifactType } from "@/lib/artifacts/mapping";
import { extractAndValidate } from "@/lib/artifacts/generateStructured";

export type GenerateResponse =
  | { text: string; templateType?: string | null; structured?: unknown }
  | { error: string; code: string };

export async function handleGenerate({
  userText,
  mode,
  signal,
  artifactType = null,
}: {
  userText: string;
  mode: AiMode;
  signal?: AbortSignal;
  artifactType?: string | null;
}): Promise<GenerateResponse> {
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in.", code: "unauthorized" };

  if (isLikelyOffTopic(userText)) {
    return {
      text: "I'm here to help with your teaching — try asking for a worksheet, quiz, or lesson idea.",
    };
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return {
      error:
        "You've done a lot of creating today 👏 — the free AI takes a breather. Come back tomorrow and keep going.",
      code: "rate_limited",
    };
  }

  const archetype = archetypeForArtifactType(artifactType);
  const profile = await getProfile(user.id);
  const system = buildSystemPrompt(
    {
      role: profile?.role ?? null,
      subject: profile?.subject ?? null,
      gradeBand: profile?.gradeBand ?? null,
    },
    mode,
    archetype,
  );

  try {
    const result = await generate({ system, user: userText, signal });
    await logEvent("ai_generate", { mode, provider: result.provider });
    if (archetype) {
      const structured = extractAndValidate(result.text, archetype);
      if (structured) {
        return { text: result.text, templateType: archetype, structured };
      }
    }
    return { text: result.text };
  } catch {
    return {
      error: "Hmm, that didn't go through. Let's try again.",
      code: "provider_error",
    };
  }
}
