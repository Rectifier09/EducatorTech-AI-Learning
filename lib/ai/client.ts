import type { AiMode } from "./guardrails";

export type GenerateReply =
  | {
      text: string;
      templateType?: string | null;
      structured?: Record<string, unknown> | null;
    }
  | { error: string; code: string };

export async function requestGenerate(
  userText: string,
  mode: AiMode = "playground",
  signal?: AbortSignal,
  artifactType?: string | null,
): Promise<GenerateReply> {
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, mode, artifactType }),
      signal,
    });
    return (await res.json()) as GenerateReply;
  } catch {
    return { error: "Network hiccup — try again.", code: "network" };
  }
}
