import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { gradePrompt } from "@/lib/ai/gradePrompt";
import { logEvent } from "@/lib/data/events";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const submission: string =
    typeof body.submission === "string" ? body.submission : "";
  if (!submission.trim()) {
    return NextResponse.json({ error: "no submission" }, { status: 400 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ code: "rate_limited" }, { status: 429 });
  }

  const grade = await gradePrompt({
    brief: typeof body.brief === "string" ? body.brief : "",
    rubric: Array.isArray(body.rubric) ? body.rubric.map(String) : [],
    submission,
  });
  await logEvent("ai_generate", { mode: "grade" });
  return NextResponse.json(grade);
}
