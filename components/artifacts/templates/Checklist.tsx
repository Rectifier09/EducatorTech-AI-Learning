import type { z } from "zod";
import type { checklistSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, ListRow } from "./primitives";

type ChecklistData = z.infer<typeof checklistSchema>;

export function Checklist({ data }: { data: ChecklistData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-2.5">
        {data.items.map((item, i) => (
          <ListRow
            key={i}
            icon={<span className="block h-4 w-4 rounded border border-line-2" />}
          >
            <span>{item.text}</span>
            {item.note && (
              <span className="ml-1.5 text-[12px] text-faint">— {item.note}</span>
            )}
          </ListRow>
        ))}
      </div>
    </div>
  );
}
