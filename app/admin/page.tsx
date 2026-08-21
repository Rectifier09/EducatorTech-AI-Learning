import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  type SurveyRow,
} from "@/lib/measurement/metrics";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!isAdmin(user?.email)) notFound();

  const admin = createAdminClient();
  const [profiles, progress, events, surveys, notify] = await Promise.all([
    admin.from("profiles").select("user_id, onboarded_at"),
    admin.from("progress").select("user_id, lesson_id, status"),
    admin.from("events").select("user_id, name, created_at"),
    admin
      .from("survey_responses")
      .select("user_id, phase, using_score, trust_score, attitude"),
    admin.from("notify_requests").select("node_id"),
  ]);

  const funnel = activationCounts({
    profiles: profiles.data ?? [],
    progress: progress.data ?? [],
    events: events.data ?? [],
  });
  const delta = avgConfidenceDelta((surveys.data ?? []) as SurveyRow[]);
  const demand = notifyDemand(notify.data ?? []);

  const pct = (n: number) =>
    funnel.onboarded > 0 ? Math.round((n / funnel.onboarded) * 100) : 0;
  const smallWinPct = pct(funnel.smallWin);
  const completePct = pct(funnel.completedTrack);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Pilot dashboard
      </h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Activation funnel
        </h2>
        <Row label="Onboarded" value={funnel.onboarded} />
        <Row label="Completed Lesson 1" value={funnel.completedL1} />
        <Row
          label="Reached the small win (L4)"
          value={`${funnel.smallWin} (${smallWinPct}%)`}
          pass={smallWinPct >= 60}
          target="≥60%"
        />
        <Row
          label="Completed the track"
          value={`${funnel.completedTrack} (${completePct}%)`}
          pass={completePct >= 40}
          target="≥40%"
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Confidence change (pre → post, n={delta.n})
        </h2>
        <Row
          label="Avg 'using AI' delta"
          value={`+${delta.avgUsingDelta}`}
          pass={delta.avgUsingDelta >= 1.5}
          target="≥+1.5"
        />
        <Row label="Avg 'trust AI' delta" value={`+${delta.avgTrustDelta}`} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          &ldquo;Notify me&rdquo; demand (what to build next)
        </h2>
        {demand.length === 0 ? (
          <p className="text-sm text-muted">No taps yet.</p>
        ) : (
          demand.map((d) => <Row key={d.nodeId} label={d.nodeId} value={d.count} />)
        )}
      </section>

      <p className="text-[11px] text-muted">
        Thresholds from the spec §10. Owner-only view.
      </p>
    </main>
  );
}

function Row({
  label,
  value,
  pass,
  target,
}: {
  label: string;
  value: string | number;
  pass?: boolean;
  target?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
      <span className="text-[14px] font-bold">{label}</span>
      <span className="flex items-center gap-2">
        {target && (
          <span
            className={`text-[11px] font-bold ${
              pass ? "text-success-ink" : "text-accent-ink"
            }`}
          >
            {pass ? "✓" : "○"} {target}
          </span>
        )}
        <span className="text-[14px] font-extrabold tabular-nums">{value}</span>
      </span>
    </div>
  );
}
