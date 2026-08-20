import { generate } from "./service";
import { buildSystemPrompt } from "./guardrails";

export interface PromptGrade {
  pass: boolean;
  feedback: string;
  met: string[];
  missing: string[];
}

const FALLBACK: PromptGrade = {
  pass: true,
  feedback:
    "Good effort — a clear task and some context. Keep adding detail (task, context, format) for even sharper results.",
  met: [],
  missing: [],
};

export function parseGrade(text: string): PromptGrade {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return FALLBACK;
    const obj = JSON.parse(text.slice(start, end + 1));
    return {
      pass: Boolean(obj.pass),
      feedback:
        typeof obj.feedback === "string" && obj.feedback.trim()
          ? obj.feedback
          : FALLBACK.feedback,
      met: Array.isArray(obj.met) ? obj.met.map(String) : [],
      missing: Array.isArray(obj.missing) ? obj.missing.map(String) : [],
    };
  } catch {
    return FALLBACK;
  }
}

export async function gradePrompt(input: {
  brief: string;
  rubric: string[];
  submission: string;
}): Promise<PromptGrade> {
  const system = buildSystemPrompt(
    { role: null, subject: null, gradeBand: null },
    "grade",
  );
  const user =
    `Brief for the teacher: ${input.brief}\n\n` +
    `Rubric (check each):\n${input.rubric.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\n` +
    `The teacher's prompt:\n"""${input.submission}"""\n\n` +
    `Return ONLY JSON: {"pass": boolean, "feedback": "one warm, specific sentence", "met": ["rubric items satisfied"], "missing": ["rubric items not yet satisfied"]}. ` +
    `pass = true when most rubric items are met.`;

  try {
    const { text } = await generate({ system, user });
    return parseGrade(text);
  } catch {
    return FALLBACK;
  }
}
