import Link from "next/link";
import type { ProgressStatus } from "@/lib/data/types";

const discStyles: Record<ProgressStatus, string> = {
  completed: "bg-success text-white border-transparent",
  active:
    "bg-accent text-[#3a2408] border-transparent shadow-[0_0_0_5px_var(--amber-soft)]",
  locked: "bg-sunk text-muted border-line",
};

export function LessonNode({
  id,
  title,
  estMinutes,
  state,
}: {
  id: string;
  title: string;
  estMinutes: number;
  state: ProgressStatus;
}) {
  const inner = (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-12 w-12 flex-none items-center justify-center rounded-2xl border text-[15px] font-extrabold ${discStyles[state]}`}
      >
        {state === "completed" ? "✓" : state === "locked" ? "🔒" : "▶"}
      </div>
      <div>
        <div
          className={`text-[14px] font-bold ${state === "locked" ? "text-muted" : "text-ink"}`}
        >
          {title}
        </div>
        <div className="text-[12px] text-muted">
          {state === "completed"
            ? "Complete"
            : state === "locked"
              ? "Locked"
              : `Continue · ~${estMinutes} min`}
        </div>
      </div>
    </div>
  );

  if (state === "locked") {
    return (
      <div aria-disabled="true" className="py-1">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/lesson/${id}`}
      className="block rounded-2xl py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {inner}
    </Link>
  );
}
