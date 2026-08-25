import { ARCHETYPE_SCHEMAS, type ArchetypeId } from "./schema";

/**
 * Same braces-extraction technique as lib/ai/gradePrompt.ts's parseGrade —
 * tolerates prose preambles and ```json fences around the JSON blob.
 * Returns the validated, typed data, or null on any failure (bad JSON,
 * wrong shape, empty required arrays) so the caller can fall back to
 * rendering the raw text through the Generic template.
 */
export function extractAndValidate(
  text: string,
  archetype: ArchetypeId,
): Record<string, unknown> | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    const obj: unknown = JSON.parse(text.slice(start, end + 1));
    const result = ARCHETYPE_SCHEMAS[archetype].safeParse(obj);
    return result.success ? (result.data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
