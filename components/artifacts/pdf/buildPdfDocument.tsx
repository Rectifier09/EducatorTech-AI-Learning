import type { z } from "zod";
import type { ReactElement } from "react";
import {
  type ArchetypeId,
  questionSetSchema,
  outlineSchema,
  rubricSchema,
  checklistSchema,
  letterSchema,
  feedbackListSchema,
} from "@/lib/artifacts/schema";
import { GenericPdf } from "./GenericPdf";
import { QuestionSetPdf } from "./QuestionSetPdf";
import { OutlinePdf } from "./OutlinePdf";
import { RubricPdf } from "./RubricPdf";
import { ChecklistPdf } from "./ChecklistPdf";
import { LetterPdf } from "./LetterPdf";
import { FeedbackListPdf } from "./FeedbackListPdf";

export function buildPdfDocument({
  templateType,
  structured,
  output,
}: {
  templateType?: string | null;
  structured?: Record<string, unknown> | null;
  output: string;
}): ReactElement<any> {
  if (structured) {
    switch (templateType as ArchetypeId | null | undefined) {
      case "questionSet":
        return <QuestionSetPdf data={structured as z.infer<typeof questionSetSchema>} />;
      case "outline":
        return <OutlinePdf data={structured as z.infer<typeof outlineSchema>} />;
      case "rubric":
        return <RubricPdf data={structured as z.infer<typeof rubricSchema>} />;
      case "checklist":
        return <ChecklistPdf data={structured as z.infer<typeof checklistSchema>} />;
      case "letter":
        return <LetterPdf data={structured as z.infer<typeof letterSchema>} />;
      case "feedbackList":
        return <FeedbackListPdf data={structured as z.infer<typeof feedbackListSchema>} />;
    }
  }
  return <GenericPdf output={output} />;
}
