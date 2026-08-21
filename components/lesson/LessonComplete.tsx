"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MascotGuide } from "@/components/brand/MascotGuide";

export function LessonComplete({
  score,
  nextId,
}: {
  score: number;
  nextId: string | null;
}) {
  const router = useRouter();
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-5 p-6 text-center">
      <span className="text-5xl" aria-hidden="true">
        🎉
      </span>
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Lesson complete!
      </h1>
      <MascotGuide mood="cheer" size={64} />
      <p className="text-muted">
        Nice work — that&apos;s another one down.
        {score < 100 ? " Review anytime to sharpen up." : ""}
      </p>
      <div className="flex w-full flex-col gap-2 pt-2">
        {nextId && (
          <Button
            variant="primary"
            onClick={() => router.push(`/lesson/${nextId}`)}
            className="w-full"
          >
            Next lesson
          </Button>
        )}
        <Button
          variant={nextId ? "ghost" : "primary"}
          onClick={() => router.push("/learn")}
          className="w-full"
        >
          Back to Learn
        </Button>
      </div>
    </main>
  );
}
