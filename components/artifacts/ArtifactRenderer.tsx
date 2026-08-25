import { Generic } from "./templates/Generic";

export interface ArtifactRendererProps {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}

/**
 * Dispatches to the on-screen template matching `templateType`. Only
 * Generic exists so far — the 6 archetype-specific templates land in a
 * follow-up plan as additional branches here; this interface (and every
 * call site) stays stable when they're added.
 */
export function ArtifactRenderer({ output }: ArtifactRendererProps) {
  return <Generic output={output} />;
}
