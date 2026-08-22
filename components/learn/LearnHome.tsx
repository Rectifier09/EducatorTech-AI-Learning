"use client";

import { useState } from "react";
import Link from "next/link";
import { useWindowCollapsibleHeader } from "@/hooks/useCollapsibleHeader";
import { ConfidenceGauge } from "@/components/gamification/ConfidenceGauge";
import { ClassFollowUp } from "@/components/followup/ClassFollowUp";
import { Card } from "@/components/ui/Card";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { JourneyList } from "@/components/learn/JourneyList";
import { ExploreList } from "@/components/learn/ExploreList";
import type { Lesson } from "@/lib/content/types";
import type { LessonProgress } from "@/lib/data/types";
import type { SkillTreeData } from "@/lib/content/skilltree";
import type { DayActivity } from "@/lib/gamification/streak";

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
  /** Server-computed time-of-day greeting, e.g. "Good morning" (Asia/Kolkata). */
  greeting: string;
  confidence: number;
  deltaThisWeek?: number;
  streak: number;
  /** Trailing 7-day activity, oldest → newest (today last). */
  weekDays: DayActivity[];
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
  greeting,
  confidence,
  deltaThisWeek,
  streak,
  weekDays,
  xp,
  continueTarget,
  continueMeta,
  lessons,
  progress,
  tree,
  notified,
  dueFollowUp,
}: LearnHomeProps) {
  // The Learn route has no bounded/overflow-hidden scroll ancestor, so the
  // document (window) itself scrolls — same as every other page in the app
  // shell (BottomTabBar relies on that too, via `sticky bottom-0`).
  const collapsed = useWindowCollapsibleHeader();
  const [tab, setTab] = useState<SubTab>("journey");

  return (
    <div className="flex flex-col">
      {/* Full hero: greeting, gauge, continue card, streak. This is normal
          document flow — it scrolls away with the page, it isn't toggled. */}
      <div className="flex flex-col items-center gap-4 px-6 pb-5 pt-6">
        <p className="text-[0.95rem] font-semibold text-muted">
          {greeting}, {firstName}
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
                current={continueMeta.index - 1}
              />
            </Card>
          </Link>
        )}

        <div className="flex flex-col items-center gap-2.5">
          <WeekDots days={weekDays} />
          <StreakRow streak={streak} xp={xp} />
        </div>
      </div>

      {dueFollowUp && (
        <div className="px-6 pb-2">
          <ClassFollowUp id={dueFollowUp.id} />
        </div>
      )}

      {/* Sticky bar: sub-tabs are always pinned; the condensed chip row
          fades/grows in above them only once the hero has scrolled past
          view (driven by window scroll position, not a fake toggle). */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-line bg-paper/95 px-6 py-2 backdrop-blur">
        <div
          className={`flex items-center gap-3 overflow-hidden transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none ${
            collapsed ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!collapsed}
        >
          <ConfidenceGauge variant="chip" value={confidence} animate={collapsed} />
          <span className="ml-auto text-[12px] font-bold text-muted">
            {streak}d · {xp} XP
          </span>
        </div>

        <div className="flex gap-1">
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

function WeekDots({ days }: { days: DayActivity[] }) {
  const activeCount = days.filter((d) => d.active).length;
  return (
    <div
      className="flex items-center gap-3"
      role="img"
      aria-label={`Activity this week: ${activeCount} of ${days.length} days active`}
    >
      {days.map((d) => (
        <div
          key={d.date}
          className="flex flex-col items-center gap-1.5"
          aria-hidden="true"
        >
          <span
            className={`text-[9px] font-bold uppercase leading-none ${
              d.isToday ? "text-brand-ink" : "text-faint"
            }`}
          >
            {d.label}
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              d.active
                ? "bg-gradient-to-br from-accent to-brand shadow-[var(--glow-gold)]"
                : "border border-line-2 bg-surface-2"
            } ${
              d.isToday
                ? d.active
                  ? "ring-1 ring-brand/50"
                  : "border-brand/70"
                : ""
            }`}
          />
        </div>
      ))}
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
