"use client";

import { useState } from "react";
import Link from "next/link";
import { requestNotify } from "@/app/actions/notify";
import { Card } from "@/components/ui/Card";
import { ProgressDots } from "@/components/ui/ProgressDots";
import { CollapsibleSection } from "./CollapsibleSection";
import type { SkillTreeData, SkillNode } from "@/lib/content/skilltree";
import type { ExploreNodeStatus } from "./LearnHome";

export function ExploreList({
  tree,
  notified,
  exploreStatus,
}: {
  tree: SkillTreeData;
  notified: string[];
  exploreStatus: Record<string, ExploreNodeStatus>;
}) {
  const [done, setDone] = useState<Set<string>>(new Set(notified));

  async function notify(nodeId: string) {
    setDone((prev) => new Set(prev).add(nodeId));
    await requestNotify(nodeId);
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        This is lesson one of a much bigger map. Here&apos;s where you&apos;re
        headed.
      </p>

      <Link
        href="/learn"
        className="rounded-2xl border border-brand/40 bg-brand-soft p-4"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-ink">
          You&apos;re here
        </p>
        <p className="font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {tree.gateway.label}
        </p>
      </Link>

      {tree.branches.map((b) => (
        <CollapsibleSection key={b.id} title={b.label} emoji={b.emoji}>
          <div className="flex flex-col gap-2">
            {b.nodes.map((n) => {
              const status = exploreStatus[n.id];
              return status?.live && status.href ? (
                <LiveNodeCard key={n.id} node={n} status={status} />
              ) : (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-bold text-ink">{n.label}</p>
                    <p className="text-[11px] text-muted">In development</p>
                  </div>
                  <button
                    onClick={() => notify(n.id)}
                    disabled={done.has(n.id)}
                    className="shrink-0 rounded-full border-[1.5px] border-brand px-3 py-1.5 text-[12px] font-bold text-brand-ink transition disabled:border-success disabled:text-success-ink"
                  >
                    {done.has(n.id) ? "Notified ✓" : "Notify me"}
                  </button>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      ))}

      <p className="text-[12px] text-muted">
        The more teachers tap &ldquo;Notify me&rdquo;, the sooner we build it.
      </p>
    </div>
  );
}

/**
 * A branch node whose track is live and enterable. Composes the existing
 * Card + ProgressDots primitives and @theme tokens — no new idioms.
 */
function LiveNodeCard({
  node,
  status,
}: {
  node: SkillNode;
  status: ExploreNodeStatus;
}) {
  return (
    <Link href={status.href!} className="block">
      <Card className="flex flex-col gap-2 !p-4">
        <p className="text-[14px] font-bold text-ink">{node.label}</p>
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {status.completed === status.total
            ? "Complete"
            : `${status.completed} / ${status.total} lessons`}
        </p>
        <ProgressDots total={status.total} current={status.completed - 1} />
      </Card>
    </Link>
  );
}
