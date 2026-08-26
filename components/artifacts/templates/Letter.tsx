import type { z } from "zod";
import type { letterSchema } from "@/lib/artifacts/schema";

type LetterData = z.infer<typeof letterSchema>;

export function Letter({ data }: { data: LetterData }) {
  return (
    <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-ink">
      {data.greeting && (
        <p style={{ fontFamily: "var(--font-display)" }}>{data.greeting}</p>
      )}
      {data.paragraphs.map((p, i) => (
        <p key={i} className="text-muted">
          {p}
        </p>
      ))}
      {data.signOff && <p style={{ fontFamily: "var(--font-display)" }}>{data.signOff}</p>}
    </div>
  );
}
