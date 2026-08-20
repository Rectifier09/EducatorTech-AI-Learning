"use client";

import { useState } from "react";
import { Playground } from "@/components/playground/Playground";
import { Button } from "@/components/ui/Button";
import { saveToToolkit } from "@/app/actions/toolkit";
import { personalize } from "@/lib/lesson/session";
import type { PlaygroundBlock } from "@/lib/content/types";
import type { Profile } from "@/lib/data/types";

export function PlaygroundBlockView({
  block,
  profile,
  lessonId,
  spineArtifact,
  onArtifact,
  onNext,
}: {
  block: PlaygroundBlock;
  profile: Pick<Profile, "subject" | "gradeBand">;
  lessonId: string;
  spineArtifact?: string;
  onArtifact: (text: string) => void;
  onNext: () => void;
}) {
  const hasChoices =
    block.mode === "make" &&
    Array.isArray(block.artifactChoices) &&
    block.artifactChoices.length > 0;
  const [choice, setChoice] = useState<string | null>(
    hasChoices ? null : "",
  );
  const [produced, setProduced] = useState(false);

  // make mode: pick an artifact type first
  if (hasChoices && choice === null) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-5">
        <h1
          className="text-[20px] font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          What do you want to make? Pick one.
        </h1>
        <div className="flex flex-col gap-2.5">
          {block.artifactChoices!.map((c) => (
            <button
              key={c}
              onClick={() => setChoice(c)}
              className="rounded-xl border-[1.5px] border-line-2 bg-surface px-4 py-3 text-left text-[15px] font-bold hover:border-brand"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // verify mode: review the artifact you made, spot what you'd fix
  if (block.mode === "verify") {
    return (
      <div className="flex flex-1 flex-col justify-between gap-6">
        <div className="flex flex-col gap-4">
          <h1
            className="text-[20px] font-semibold text-balance"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Read it as the expert — what&apos;s one thing you&apos;d fix?
          </h1>
          <div className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-surface p-3 text-[13px] leading-relaxed">
            {spineArtifact ?? "(the material you made earlier)"}
          </div>
          <p className="text-sm text-muted">
            Spotting what to change is the skill — that&apos;s your judgement at
            work.
          </p>
        </div>
        <Button variant="primary" onClick={onNext} className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  // make / refine: the guided playground
  const scaffold = personalize(block.scaffold, profile).replace(
    /\{\{artifact\}\}/g,
    choice ?? "",
  );
  const refineSeed =
    block.mode === "refine" && spineArtifact
      ? `Improve this for my class — make it a little easier:\n\n${spineArtifact}`
      : undefined;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Playground
        scaffold={scaffold}
        seedContent={refineSeed}
        mode="playground"
        artifactType={choice || null}
        lessonId={lessonId}
        allowSave={false}
        onResult={(text, prompt) => {
          onArtifact(text);
          setProduced(true);
          if (block.saveToToolkit !== false) {
            void saveToToolkit({
              prompt,
              output: text,
              artifactType: choice || null,
              lessonId,
            });
          }
        }}
      />
      {produced && block.saveToToolkit !== false && (
        <p className="text-[13px] font-bold text-success-ink">
          ✓ Saved to your Toolkit — it&apos;s yours.
        </p>
      )}
      <Button
        variant="primary"
        onClick={onNext}
        disabled={!produced}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
