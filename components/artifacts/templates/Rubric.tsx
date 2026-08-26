import type { z } from "zod";
import type { rubricSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading } from "./primitives";

type RubricData = z.infer<typeof rubricSchema>;

export function Rubric({ data }: { data: RubricData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-4">
        {data.criteria.map((c, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <p className="text-[14px] font-bold text-ink">{c.name}</p>
            <div className="flex flex-col gap-1 pl-1">
              {c.levels.map((lvl, j) => (
                <p key={j} className="text-[13px] text-muted">
                  <span className="font-bold text-ink">{lvl.label}: </span>
                  {lvl.description}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
