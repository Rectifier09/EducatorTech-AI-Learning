"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  initSession,
  advance,
  recordResult,
  computeScore,
  setSpineArtifact,
  type SessionState,
} from "@/lib/lesson/session";
import { TheoryBlockView } from "./blocks/TheoryBlockView";
import { McqBlockView } from "./blocks/McqBlockView";
import { OrderBlockView } from "./blocks/OrderBlockView";
import { FillBlankBlockView } from "./blocks/FillBlankBlockView";
import { ReflectionBlockView } from "./blocks/ReflectionBlockView";
import { PromptWriteBlockView } from "./blocks/PromptWriteBlockView";
import { PlaygroundBlockView } from "./blocks/PlaygroundBlockView";
import { PostSurvey } from "@/components/capstone/PostSurvey";
import { LessonComplete } from "./LessonComplete";
import { finishLesson } from "@/app/actions/lesson";
import type { Lesson, Block } from "@/lib/content/types";
import type { Profile } from "@/lib/data/types";

type ProfileCtx = Pick<Profile, "subject" | "gradeBand">;

export function LessonPlayer({
  lesson,
  profile,
  nextId,
  initialSpine,
  showGoDeeper = false,
}: {
  lesson: Lesson;
  profile: ProfileCtx;
  nextId: string | null;
  initialSpine?: string;
  showGoDeeper?: boolean;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>(() =>
    initSession(lesson, initialSpine),
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
    <main className="flex min-h-full flex-col gap-8 p-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/learn")}
          aria-label="Close lesson"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:border-line-2 hover:text-ink"
        >
          <span aria-hidden="true" className="text-base leading-none">
            ×
          </span>
        </button>
        <ProgressBar current={session.index} total={total} />
      </div>
      <div className="flex flex-1 flex-col">
        {/* key per block id: remounts so per-block state (selection, solved)
            never leaks between consecutive blocks of the same type */}
        <BlockRenderer
          key={block.id}
          block={block}
          profile={profile}
          lessonId={lesson.id}
          spineArtifact={session.spineArtifact}
          onArtifact={(t) => setSession((s) => setSpineArtifact(s, t))}
          showGoDeeper={showGoDeeper}
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
      className="h-[5px] flex-1 overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemax={total}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand to-accent shadow-[var(--glow-gold)] transition-all"
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
  lessonId,
  spineArtifact,
  onArtifact,
  showGoDeeper,
  onNext,
  onResult,
}: {
  block: Block;
  profile: ProfileCtx;
  lessonId: string;
  spineArtifact?: string;
  onArtifact: (text: string) => void;
  showGoDeeper: boolean;
  onNext: () => void;
  onResult: (passed: boolean) => void;
}) {
  switch (block.type) {
    case "theory":
      return (
        <TheoryBlockView
          block={block}
          profile={profile}
          onNext={onNext}
          showGoDeeper={showGoDeeper}
        />
      );
    case "reflection":
      return (
        <ReflectionBlockView
          block={block}
          lessonId={lessonId}
          onNext={onNext}
        />
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
    case "promptWrite":
      return (
        <PromptWriteBlockView
          block={block}
          onNext={onNext}
          onResult={onResult}
        />
      );
    case "playground":
      return (
        <PlaygroundBlockView
          block={block}
          profile={profile}
          lessonId={lessonId}
          spineArtifact={spineArtifact}
          onArtifact={onArtifact}
          onNext={onNext}
        />
      );
    case "postSurvey":
      return <PostSurvey onNext={onNext} />;
    default:
      // exhaustive — all block types handled above
      return null;
  }
}
