"use client";

import { Button } from "@/components/ui/Button";
import { personalize } from "@/lib/lesson/session";
import type { TheoryBlock } from "@/lib/content/types";
import type { Profile } from "@/lib/data/types";

export function TheoryBlockView({
  block,
  profile,
  onNext,
}: {
  block: TheoryBlock;
  profile: Pick<Profile, "subject" | "gradeBand">;
  onNext: () => void;
}) {
  const paragraphs = personalize(block.body, profile).split("\n\n");

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        {block.title && (
          <h1
            className="text-[22px] font-semibold text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {personalize(block.title, profile)}
          </h1>
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[15px] leading-relaxed">
            {p}
          </p>
        ))}
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
      </Button>
    </div>
  );
}
