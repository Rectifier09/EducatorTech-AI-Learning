import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activationCounts,
  avgConfidenceDelta,
  notifyDemand,
  journeyFunnel,
  reflectionValueByLesson,
  lessonHealthRanking,
  type SurveyRow,
  type EventRow,
  type TrackInput,
} from "@/lib/measurement/metrics";
import { getSkillTree } from "@/lib/content/skilltree";
import { getTrack, trackExists } from "@/lib/content/loader";

export const dynamic = "force-dynamic";

/** Live tracks (content exists + skilltree marks live): gateway + branch nodes. */
function liveTracks(): TrackInput[] {
  const tree = getSkillTree();
  const ids: string[] = [
    ...(tree.gateway.live && trackExists(tree.gateway.id)
      ? [tree.gateway.id]
      : []),
    ...tree.branches.flatMap((b) =>
      b.nodes.filter((n) => n.live && trackExists(n.id)).map((n) => n.id),
    ),
  ];
  return ids.map((id) => {
    const t = getTrack(id);
    return { trackId: t.id, title: t.title, lessonIds: t.lessonIds };
  });
}

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!isAdmin(user?.email)) notFound();

  const admin = createAdminClient();
  const [profiles, progress, events, surveys, notify] = await Promise.all([
    admin.from("profiles").select("user_id, onboarded_at"),
    admin.from("progress").select("user_id, lesson_id, status"),
    admin.from("events").select("user_id, name, created_at, props"),
    admin
      .from("survey_responses")
      .select("user_id, phase, using_score, trust_score, attitude"),
    admin.from("notify_requests").select("node_id"),
  ]);

  const progressRows = progress.data ?? [];
  const eventRows = (events.data ?? []) as EventRow[];

  const funnel = activationCounts({
    profiles: profiles.data ?? [],
    progress: progressRows,
    events: eventRows,
  });
  const delta = avgConfidenceDelta((surveys.data ?? []) as SurveyRow[]);
  const demand = notifyDemand(notify.data ?? []);

  const tracks = liveTracks();
  const journeys = journeyFunnel({
    tracks,
    progress: progressRows,
    events: eventRows,
  });
  const reflection = reflectionValueByLesson(eventRows);
  const reviewNext = lessonHealthRanking({ journeys, reflection });

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

      <section className="flex flex-col gap-4">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Per-journey (started → completed)
        </h2>
        {journeys.length === 0 ? (
          <p className="text-sm text-muted">No live tracks.</p>
        ) : (
          journeys.map((j) => (
            <div key={j.trackId} className="flex flex-col gap-1.5">
              <Row
                label={j.title}
                value={`${j.started} → ${j.completed} (${j.completionPct}%)`}
              />
              {j.started > 0 && (
                <div className="flex flex-col gap-1 pl-3">
                  {j.lessons.map((l) => (
                    <div
                      key={l.lessonId}
                      className="flex items-center justify-between gap-3 text-[12px] text-muted"
                    >
                      <span className="font-bold">{l.lessonId}</span>
                      <span className="tabular-nums">
                        {l.started} → {l.completed}
                        {l.started > 0 && l.dropoffPct > 0
                          ? ` · ${l.dropoffPct}% drop`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted">
          Content quality — review next
        </h2>
        {reviewNext.length === 0 ? (
          <p className="text-sm text-muted">
            No concerning lessons yet (drop-off + reflection all healthy).
          </p>
        ) : (
          reviewNext.map((r) => (
            <div
              key={`${r.trackId}:${r.lessonId}`}
              className="flex flex-col gap-1 rounded-xl border border-line bg-surface px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-bold">
                  {r.trackId} · {r.lessonId}
                </span>
                <span className="text-[13px] font-extrabold tabular-nums text-accent-ink">
                  {r.concern}
                </span>
              </div>
              <span className="text-[12px] text-muted">{r.reason}</span>
            </div>
          ))
        )}
        <p className="text-[11px] text-muted">
          Concern = traffic-weighted drop-off + low reflection (avg &lt;3/5).
        </p>
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
