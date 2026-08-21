"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MascotGuide } from "@/components/brand/MascotGuide";
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
  // Ravi is restrained: he only surfaces on cards that have something extra
  // to hold onto (a go-deeper aside), never on every theory card.
  const showRavi = showGoDeeper && Boolean(block.goDeeper);

  return (
    <div className="flex flex-1 flex-col justify-between gap-10">
      <div className="mx-auto flex w-full max-w-[65ch] flex-col gap-5">
        {block.title && (
          <h1
            className="text-[26px] font-semibold leading-tight text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {personalize(block.title, profile)}
          </h1>
        )}
        <div className="flex flex-col gap-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[16px] leading-relaxed text-ink/90">
              {p}
            </p>
          ))}
        </div>
        {showGoDeeper && block.goDeeper && (
          <div className="rounded-2xl border border-line bg-sunk p-4">
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-[13px] font-extrabold tracking-wide text-brand-ink"
            >
              {open ? "Hide" : "Go deeper →"}
            </button>
            {open && (
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                {personalize(block.goDeeper, profile)}
              </p>
            )}
          </div>
        )}
        {showRavi && (
          <MascotGuide
            mood="reassure"
            size={40}
            caption="Hold onto that last line."
          />
        )}
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
      </Button>
    </div>
  );
}
