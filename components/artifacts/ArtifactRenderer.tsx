import type { z } from "zod";
import {
  type ArchetypeId,
  questionSetSchema,
  outlineSchema,
  rubricSchema,
  checklistSchema,
  letterSchema,
  feedbackListSchema,
} from "@/lib/artifacts/schema";
import { Generic } from "./templates/Generic";
import { QuestionSet } from "./templates/QuestionSet";
import { Outline } from "./templates/Outline";
import { Rubric } from "./templates/Rubric";
import { Checklist } from "./templates/Checklist";
import { Letter } from "./templates/Letter";
import { FeedbackList } from "./templates/FeedbackList";

export interface ArtifactRendererProps {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}

/**
 * Dispatches to the on-screen template matching `templateType`. Unknown
 * or unrecognized `templateType`, or a missing `structured` payload,
 * always falls back to Generic — this is what keeps every pre-Plan-1 row
 * and every Playground-freeform result rendering unchanged.
 */
export function ArtifactRenderer({
  templateType,
  structured,
  output,
}: ArtifactRendererProps) {
  if (structured) {
    switch (templateType as ArchetypeId | null | undefined) {
      case "questionSet":
        return <QuestionSet data={structured as z.infer<typeof questionSetSchema>} />;
      case "outline":
        return <Outline data={structured as z.infer<typeof outlineSchema>} />;
      case "rubric":
        return <Rubric data={structured as z.infer<typeof rubricSchema>} />;
      case "checklist":
        return <Checklist data={structured as z.infer<typeof checklistSchema>} />;
      case "letter":
        return <Letter data={structured as z.infer<typeof letterSchema>} />;
      case "feedbackList":
        return <FeedbackList data={structured as z.infer<typeof feedbackListSchema>} />;
    }
  }
  return <Generic output={output} />;
}
