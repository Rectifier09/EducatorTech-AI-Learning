"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RewardMoment } from "@/components/reward/RewardMoment";
import type { Badge } from "@/lib/gamification/badges";

export function LessonComplete({
  score,
  nextId,
  newBadges = [],
}: {
  score: number;
  nextId: string | null;
  newBadges?: Badge[];
}) {
  const router = useRouter();
  // Any newly-earned badges get a brief unlock moment first; the standard
  // lesson-complete moment always shows last.
  const [badgeIndex, setBadgeIndex] = useState(0);
  const goNext = () => router.push(nextId ? `/lesson/${nextId}` : "/learn");

  if (badgeIndex < newBadges.length) {
    const badge = newBadges[badgeIndex];
    return (
      <main className="flex min-h-full flex-col p-6">
        <RewardMoment
          kicker="New badge"
          title={`${badge.label} unlocked`}
          gauge={
            <span className="text-6xl" aria-hidden="true">
              {badge.emoji}
            </span>
          }
          primaryLabel="Nice!"
          onPrimary={() => setBadgeIndex((i) => i + 1)}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-col p-6">
      <RewardMoment
        kicker="Lesson complete"
        title="That's another one down."
        primaryLabel={nextId ? "Next lesson" : "Back to Learn"}
        onPrimary={goNext}
        secondaryLabel={nextId ? "Back to Learn" : undefined}
        onSecondary={nextId ? () => router.push("/learn") : undefined}
      >
        {score < 100
          ? "Nice work — review anytime to sharpen up."
          : "Nice work — perfect run."}
      </RewardMoment>
    </main>
  );
}
