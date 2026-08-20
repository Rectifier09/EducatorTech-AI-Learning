import type { AiMode } from "./guardrails";

export type GenerateReply = { text: string } | { error: string; code: string };

export async function requestGenerate(
  userText: string,
  mode: AiMode = "playground",
): Promise<GenerateReply> {
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, mode }),
    });
    return (await res.json()) as GenerateReply;
  } catch {
    return { error: "Network hiccup — try again.", code: "network" };
  }
}
