"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { personalize } from "@/lib/lesson/session";
import type { TheoryBlock } from "@/lib/content/types";
import type { Profile } from "@/lib/data/types";

export function TheoryBlockView({
  block,
  profile,
  onNext,
  showGoDeeper = false,
}: {
  block: TheoryBlock;
  profile: Pick<Profile, "subject" | "gradeBand">;
  onNext: () => void;
  showGoDeeper?: boolean;
}) {
  const paragraphs = personalize(block.body, profile).split("\n\n");
  const [open, setOpen] = useState(false);

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
        {showGoDeeper && block.goDeeper && (
          <div className="rounded-xl border border-line bg-surface-2 p-3">
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-[13px] font-extrabold text-brand-ink"
            >
              {open ? "Hide" : "Go deeper →"}
            </button>
            {open && (
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                {personalize(block.goDeeper, profile)}
              </p>
            )}
          </div>
        )}
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
      </Button>
    </div>
  );
}
