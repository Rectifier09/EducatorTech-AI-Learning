import Link from "next/link";
import type { ProgressStatus } from "@/lib/data/types";

function Marker({ state }: { state: ProgressStatus }) {
  if (state === "completed") {
    return (
      <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-brand/40 bg-brand-soft text-[12px] font-bold text-brand-ink">
        ✓
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="h-2.5 w-2.5 flex-none rounded-full bg-brand shadow-[var(--glow-gold)]" />
    );
  }
  return (
    <div className="h-2.5 w-2.5 flex-none rounded-full border border-line-2 bg-transparent" />
  );
}

export function JourneyRow({
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
    <div className="flex items-center gap-4 px-1 py-1">
      <Marker state={state} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[15px] font-bold ${
            state === "locked" ? "text-faint" : "text-ink"
          }`}
        >
          {title}
        </p>
        <p className="text-[12px] text-muted">
          {state === "completed"
            ? "Complete"
            : state === "locked"
              ? "Locked"
              : `Continue · ~${estMinutes} min`}
        </p>
      </div>
    </div>
  );

  if (state === "locked") {
    return (
      <div aria-disabled="true" className="rounded-2xl">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/lesson/${id}`}
      className="block rounded-2xl transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {inner}
    </Link>
  );
}
