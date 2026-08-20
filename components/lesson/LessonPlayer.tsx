"use client";

import { useState } from "react";
import Link from "next/link";
import {
  initSession,
  advance,
  recordResult,
  computeScore,
  personalize,
  type SessionState,
} from "@/lib/lesson/session";
import { Button } from "@/components/ui/Button";
import type { Lesson, Block } from "@/lib/content/types";
import type { Profile } from "@/lib/data/types";

type ProfileCtx = Pick<Profile, "subject" | "gradeBand">;

export function LessonPlayer({
  lesson,
  profile,
}: {
  lesson: Lesson;
  profile: ProfileCtx;
}) {
  const [session, setSession] = useState<SessionState>(() =>
    initSession(lesson),
  );
  const total = lesson.blocks.length;

  if (session.done) {
    // Task 11 replaces this with the real completion/celebration + unlock.
    return (
      <main className="flex min-h-full flex-col items-start gap-4 p-6">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Lesson complete! 🎉
        </h1>
        <p className="text-muted">Score: {computeScore(session.results)}</p>
        <Link href="/path">
          <Button variant="primary">Back to path</Button>
        </Link>
      </main>
    );
  }

  const block = lesson.blocks[session.index];
  const onNext = () => setSession((s) => advance(s, total));
  const onResult = (passed: boolean) =>
    setSession((s) => recordResult(s, block.id, passed));

  return (
    <main className="flex min-h-full flex-col gap-4 p-6">
      <ProgressBar current={session.index} total={total} />
      <div className="flex flex-1 flex-col">
        <BlockRenderer
          block={block}
          profile={profile}
          onNext={onNext}
          onResult={onResult}
        />
      </div>
    </main>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div
      className="h-1.5 w-full rounded-full bg-sunk"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemax={total}
    >
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// Placeholder — Tasks 6–10 replace each case with the real block view.
function BlockRenderer({
  block,
  profile,
  onNext,
}: {
  block: Block;
  profile: ProfileCtx;
  onNext: () => void;
  onResult: (passed: boolean) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-1 flex-col justify-center gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          {block.type}
        </p>
        <p className="text-[15px] leading-relaxed">
          {"body" in block ? personalize(block.body, profile) : block.id}
        </p>
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
      </Button>
    </div>
  );
}
