import type { z } from "zod";
import type { outlineSchema } from "@/lib/artifacts/schema";
import { ArtifactHeading, Pill } from "./primitives";

type OutlineData = z.infer<typeof outlineSchema>;

export function Outline({ data }: { data: OutlineData }) {
  return (
    <div className="flex flex-col gap-4">
      <ArtifactHeading>{data.title}</ArtifactHeading>
      <div className="flex flex-col gap-3">
        {data.sections.map((s, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-ink">{s.heading}</p>
              {s.timeEstimate && <Pill>{s.timeEstimate}</Pill>}
            </div>
            <ul className="flex flex-col gap-0.5 pl-4 text-[13px] text-muted">
              {s.bullets.map((b, j) => (
                <li key={j} className="list-disc">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
