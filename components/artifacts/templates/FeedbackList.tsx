import type { z } from "zod";
import type { feedbackListSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, ListRow } from "./primitives";

type FeedbackListData = z.infer<typeof feedbackListSchema>;

export function FeedbackList({ data }: { data: FeedbackListData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-2.5">
        {data.items.map((item, i) => (
          <ListRow key={i}>
            {item.label && (
              <span className="mr-1.5 rounded-full bg-sunk px-2 py-0.5 text-[11px] font-bold text-muted">
                {item.label}
              </span>
            )}
            <span>{item.comment}</span>
          </ListRow>
        ))}
      </div>
    </div>
  );
}
