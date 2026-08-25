import type { ReactNode } from "react";

/**
 * Minimal, safe formatter for AI prose. Turns "### heading" lines into
 * bold headings and "**bold**" spans into real <strong> elements — never
 * dangerouslySetInnerHTML, since this text comes straight from the model.
 */
export function formatLightMarkdown(text: string): ReactNode[] {
  return text.split("\n").map((line, i) => {
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    const content = headingMatch ? headingMatch[1] : line;
    const parts = content
      .split(/(\*\*[^*]+\*\*)/g)
      .filter((part) => part.length > 0)
      .map((part, j) => {
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
        return boldMatch ? <strong key={j}>{boldMatch[1]}</strong> : part;
      });
    const body = parts.length > 0 ? parts : " ";
    return headingMatch ? (
      <p key={i} className="mt-3 font-bold text-ink first:mt-0">
        {body}
      </p>
    ) : (
      <p key={i} className="text-muted">
        {body}
      </p>
    );
  });
}
