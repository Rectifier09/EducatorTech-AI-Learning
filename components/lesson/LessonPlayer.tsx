"use client";

import { useState, useEffect, useRef } from "react";
import {
  initSession,
  advance,
  recordResult,
  computeScore,
  type SessionState,
} from "@/lib/lesson/session";
import { Button } from "@/components/ui/Button";
import { TheoryBlockView } from "./blocks/TheoryBlockView";
import { McqBlockView } from "./blocks/McqBlockView";
import { OrderBlockView } from "./blocks/OrderBlockView";
import { FillBlankBlockView } from "./blocks/FillBlankBlockView";
import { LessonComplete } from "./LessonComplete";
import { finishLesson } from "@/app/actions/lesson";
import type { Lesson, Block } from "@/lib/content/types";
import type { Profile } from "@/lib/data/types";

type ProfileCtx = Pick<Profile, "subject" | "gradeBand">;

export function LessonPlayer({
  lesson,
  profile,
  nextId,
}: {
  lesson: Lesson;
  profile: ProfileCtx;
  nextId: string | null;
}) {
  const [session, setSession] = useState<SessionState>(() =>
    initSession(lesson),
  );
  const total = lesson.blocks.length;
  const score = computeScore(session.results);
  const finished = useRef(false);

  useEffect(() => {
    if (session.done && !finished.current) {
      finished.current = true;
      void finishLesson(lesson.id, score);
    }
  }, [session.done, lesson.id, score]);

  if (session.done) {
    return <LessonComplete score={score} nextId={nextId} />;
  }

  const block = lesson.blocks[session.index];
  const onNext = () => setSession((s) => advance(s, total));
  const onResult = (passed: boolean) =>
    setSession((s) => recordResult(s, block.id, passed));

  return (
    <main className="flex min-h-full flex-col gap-4 p-6">
      <ProgressBar current={session.index} total={total} />
      <div className="flex flex-1 flex-col">
        {/* key per block id: remounts so per-block state (selection, solved)
            never leaks between consecutive blocks of the same type */}
        <BlockRenderer
          key={block.id}
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

// Renders the current block. Tasks 7–10 add the remaining real block views;
// unimplemented types fall through to a graceful stub.
function BlockRenderer({
  block,
  profile,
  onNext,
  onResult,
}: {
  block: Block;
  profile: ProfileCtx;
  onNext: () => void;
  onResult: (passed: boolean) => void;
}) {
  switch (block.type) {
    case "theory":
      return (
        <TheoryBlockView block={block} profile={profile} onNext={onNext} />
      );
    case "mcq":
      return (
        <McqBlockView block={block} onNext={onNext} onResult={onResult} />
      );
    case "order":
      return (
        <OrderBlockView block={block} onNext={onNext} onResult={onResult} />
      );
    case "fillBlank":
      return (
        <FillBlankBlockView block={block} onNext={onNext} onResult={onResult} />
      );
    default:
      return <StubBlock type={block.type} onNext={onNext} />;
  }
}

function StubBlock({ type, onNext }: { type: string; onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-1 flex-col justify-center gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          {type}
        </p>
        <p className="text-[15px] text-muted">
          This exercise type is coming soon.
        </p>
      </div>
      <Button variant="primary" onClick={onNext} className="w-full">
        Continue
      </Button>
    </div>
  );
}
