import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { listArtifacts, artifactTitle } from "@/lib/data/toolkit";
import { totalMinutesSaved, formatHoursSaved } from "@/lib/toolkit/timeSaved";
import { Playground } from "@/components/playground/Playground";
import { ArtifactCard } from "@/components/toolkit/ArtifactCard";

export const dynamic = "force-dynamic";

// Thin host for the Create tab: combines the old /playground + /toolkit
// pages so the new 3-tab IA (Learn·Create·You) is navigable end-to-end.
// Phase 5 replaces this with the full studio experience.
export default async function CreatePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const subject = profile?.subject ?? "your subject";
  const grade = profile?.gradeBand ?? "your";
  const scaffold = `Make a 5-question worksheet on [topic] for a ${grade} ${subject} class, with an answer key.`;

  const artifacts = await listArtifacts(user.id);

  return (
    <main className="flex min-h-full flex-col gap-8 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Create
      </h1>

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] font-bold text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Playground
        </h2>
        <p className="text-sm text-muted">
          Practice with real AI — edit the prompt (swap <code>[topic]</code>)
          and generate.
        </p>
        <Playground scaffold={scaffold} mode="playground" />
      </section>

      <section className="flex flex-col gap-4">
        <h2
          className="text-[15px] font-bold text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          My Toolkit
        </h2>

        {artifacts.length > 0 && (
          <p className="text-sm font-bold text-success-ink">
            SahajAiVidya has saved you about{" "}
            {formatHoursSaved(totalMinutesSaved(artifacts))} so far.{" "}
            <span className="font-normal text-muted">(estimated)</span>
          </p>
        )}

        {artifacts.length === 0 ? (
          <p className="text-muted">
            Your first creation will live here. Make something in the
            playground above and it&apos;s yours to keep.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {artifacts.map((a) => (
              <ArtifactCard
                key={a.id}
                title={artifactTitle(a)}
                output={a.output}
                createdAt={a.createdAt}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
