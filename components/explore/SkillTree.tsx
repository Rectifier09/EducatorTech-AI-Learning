"use client";

import { useState } from "react";
import Link from "next/link";
import { requestNotify } from "@/app/actions/notify";
import type { SkillTreeData } from "@/lib/content/skilltree";

export function SkillTree({
  tree,
  notified,
}: {
  tree: SkillTreeData;
  notified: string[];
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
        href="/path"
        className="rounded-2xl border-2 border-success bg-success-soft p-4"
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-success-ink">
          You&apos;re here
        </p>
        <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {tree.gateway.label}
        </p>
      </Link>

      {tree.branches.map((b) => (
        <div key={b.id} className="flex flex-col gap-2">
          <p className="text-[13px] font-bold">
            {b.emoji} {b.label}
          </p>
          {b.nodes.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-line-2 bg-surface px-3 py-2.5"
            >
              <div>
                <p className="text-[14px] font-bold text-muted">🔒 {n.label}</p>
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
          ))}
        </div>
      ))}

      <p className="text-[12px] text-muted">
        The more teachers tap &ldquo;Notify me&rdquo;, the sooner we build it.
      </p>
    </div>
  );
}
