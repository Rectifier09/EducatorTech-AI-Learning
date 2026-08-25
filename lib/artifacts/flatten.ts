/**
 * Turns a parsed archetype object into plain readable text — no JSON
 * syntax — as a stopgap until per-archetype visual templates exist.
 * Fully generic: walks whatever shape it's given, no archetype branches.
 */
export function flattenStructuredToText(data: unknown, depth = 0): string {
  if (data == null) return "";
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") return String(data);

  const indent = "  ".repeat(depth);

  if (Array.isArray(data)) {
    return data
      .map((item, i) => `${indent}${i + 1}. ${flattenStructuredToText(item, depth + 1).trim()}`)
      .join("\n");
  }

  if (typeof data === "object") {
    return Object.entries(data as Record<string, unknown>)
      .map(([key, value]) => {
        const rendered = flattenStructuredToText(value, depth + 1);
        return rendered.includes("\n")
          ? `${indent}${key}:\n${rendered}`
          : `${indent}${key}: ${rendered}`;
      })
      .join("\n");
  }

  return String(data);
}
