"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useCollapsibleHeader } from "@/hooks/useCollapsibleHeader";
import { ConfidenceGauge } from "@/components/gamification/ConfidenceGauge";
import { ClassFollowUp } from "@/components/followup/ClassFollowUp";
import { Card } from "@/components/ui/Card";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { JourneyList } from "@/components/learn/JourneyList";
import { ExploreList } from "@/components/learn/ExploreList";
import type { Lesson } from "@/lib/content/types";
import type { LessonProgress } from "@/lib/data/types";
import type { SkillTreeData } from "@/lib/content/skilltree";

type SubTab = "journey" | "explore";

export interface ContinueMeta {
  title: string;
  /** 0-indexed position of this lesson in the journey. */
  index: number;
  estMinutes: number;
}

interface DueFollowUp {
  id: string;
}

interface LearnHomeProps {
  firstName: string;
  confidence: number;
  deltaThisWeek?: number;
  streak: number;
  xp: number;
  continueTarget: string | null;
  continueMeta: ContinueMeta | null;
  lessons: Lesson[];
  progress: Record<string, LessonProgress>;
  tree: SkillTreeData;
  notified: string[];
  dueFollowUp: DueFollowUp | null;
}

export function LearnHome({
  firstName,
  confidence,
  deltaThisWeek,
  streak,
  xp,
  continueTarget,
  continueMeta,
  lessons,
  progress,
  tree,
  notified,
  dueFollowUp,
}: LearnHomeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const collapsed = useCollapsibleHeader(scrollRef);
  const [tab, setTab] = useState<SubTab>("journey");

  return (
    <div
      ref={scrollRef}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto"
    >
      {/* Expanded hero: greeting, gauge, continue card, streak. Slides away
          on scroll; respects prefers-reduced-motion via motion-reduce. */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none"
        style={{
          maxHeight: collapsed ? 0 : 640,
          opacity: collapsed ? 0 : 1,
        }}
        aria-hidden={collapsed}
      >
        <div className="flex flex-col items-center gap-4 px-6 pb-5 pt-6">
          <p className="text-[0.95rem] font-semibold text-muted">
            Good evening, {firstName}
          </p>

          <ConfidenceGauge
            variant="full"
            value={confidence}
            deltaThisWeek={deltaThisWeek}
          />

          {continueTarget && continueMeta && (
            <Link href={`/lesson/${continueTarget}`} className="w-full">
              <Card className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  Continue · Lesson {continueMeta.index + 1} · ~
                  {continueMeta.estMinutes} min
                </p>
                <p
                  className="text-[17px] font-bold text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {continueMeta.title}
                </p>
                <ProgressDots
                  total={lessons.length}
                  current={continueMeta.index}
                />
              </Card>
            </Link>
          )}

          <StreakRow streak={streak} xp={xp} />
        </div>
      </div>

      {/* Condensed bar: only present once collapsed, pins above the
          sub-tabs so the two form one sticky header together. */}
      {collapsed && (
        <div className="flex items-center gap-3 px-6 pb-3 pt-1">
          <ConfidenceGauge variant="chip" value={confidence} />
          <span className="ml-auto text-[12px] font-bold text-muted">
            {streak}d · {xp} XP
          </span>
        </div>
      )}

      {dueFollowUp && (
        <div className="px-6 pb-2">
          <ClassFollowUp id={dueFollowUp.id} />
        </div>
      )}

      {/* Sticky sub-tab switch — always sticky; pins to the very top once
          the hero above it has collapsed out of flow. */}
      <div className="sticky top-0 z-10 flex gap-1 border-b border-line bg-paper/95 px-6 py-2 backdrop-blur">
        <SubTabButton
          active={tab === "journey"}
          onClick={() => setTab("journey")}
        >
          Your Journey
        </SubTabButton>
        <SubTabButton
          active={tab === "explore"}
          onClick={() => setTab("explore")}
        >
          Explore Learning
        </SubTabButton>
      </div>

      <div className="px-6 py-4">
        {tab === "journey" ? (
          <JourneyList lessons={lessons} progress={progress} />
        ) : (
          <ExploreList tree={tree} notified={notified} />
        )}
      </div>
    </div>
  );
}

function StreakRow({ streak, xp }: { streak: number; xp: number }) {
  return (
    <p className="flex items-center gap-2 text-[13px] font-bold text-muted">
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 rounded-full bg-brand shadow-[var(--glow-gold)]"
      />
      {streak}-day streak · {xp} XP
    </p>
  );
}

function SubTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 rounded-full py-2 text-[13px] font-bold transition ${
        active
          ? "bg-brand-soft text-brand-ink"
          : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
