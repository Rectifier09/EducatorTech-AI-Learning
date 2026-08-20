"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { MascotGuide } from "@/components/brand/MascotGuide";
import { completeOnboarding } from "@/app/actions/onboarding";
import { buildTasteExample } from "@/lib/onboarding/tasteTemplate";
import { requestGenerate } from "@/lib/ai/client";

export function StepTaste({
  subject,
  gradeBand,
}: {
  subject: string | null;
  gradeBand: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { promptShown, sampleOutput } = buildTasteExample(
    subject ?? "your subject",
    gradeBand ?? "your",
  );

  // Try a live example; fall back to the canned one on any error/slowness.
  const [live, setLive] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await requestGenerate(
        `Write ONE short, friendly quiz question for a ${gradeBand ?? "school"} ${subject ?? "class"} class. Just the question, nothing else.`,
        "taste",
      );
      if (!cancelled && "text" in r && r.text.trim()) setLive(r.text.trim());
    })();
    return () => {
      cancelled = true;
    };
  }, [subject, gradeBand]);

  async function start() {
    if (busy) return;
    setBusy(true);
    await completeOnboarding();
    router.push("/path");
  }

  return (
    <div className="flex flex-1 flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        <MascotGuide
          mood="cheer"
          caption="Before anything else — watch this. I'll ask AI for something for your class."
        />
        <div className="rounded-xl border border-line bg-sunk p-3.5">
          <p className="text-[13px] font-bold text-brand-ink">{promptShown}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3.5 text-[14px] leading-relaxed">
          {live ?? sampleOutput}
        </div>
        <p className="text-[14px] text-muted">
          That took seconds. Next, you&apos;ll do it yourself — and learn how to
          make sure it&apos;s actually good.
        </p>
      </div>
      <Button
        variant="primary"
        onClick={start}
        disabled={busy}
        className="w-full"
      >
        {busy ? "Starting…" : "Start Lesson 1"}
      </Button>
    </div>
  );
}
