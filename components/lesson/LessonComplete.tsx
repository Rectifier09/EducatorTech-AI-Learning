"use client";

import { useRouter } from "next/navigation";
import { RewardMoment } from "@/components/reward/RewardMoment";

export function LessonComplete({
  score,
  nextId,
}: {
  score: number;
  nextId: string | null;
}) {
  const router = useRouter();
  const goNext = () =>
    router.push(nextId ? `/lesson/${nextId}` : "/learn");

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
