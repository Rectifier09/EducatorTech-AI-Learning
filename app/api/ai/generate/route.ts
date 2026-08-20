import { NextResponse } from "next/server";
import { handleGenerate } from "@/lib/ai/handler";
import type { AiMode } from "@/lib/ai/guardrails";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const userText: string = typeof body.userText === "string" ? body.userText : "";
  const mode: AiMode = body.mode ?? "playground";

  const result = await handleGenerate({ userText, mode });

  if ("error" in result) {
    const status =
      result.code === "unauthorized"
        ? 401
        : result.code === "rate_limited"
          ? 429
          : 502;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
