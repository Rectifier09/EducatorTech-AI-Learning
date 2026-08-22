import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { listArtifacts, artifactTitle } from "@/lib/data/toolkit";
import { totalMinutesSaved, formatHoursSaved } from "@/lib/toolkit/timeSaved";
import { Playground } from "@/components/playground/Playground";
import { ArtifactCard } from "@/components/toolkit/ArtifactCard";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

// The Create tab: a premium studio built on the existing Playground +
// Toolkit logic (reused as-is) — an editorial frame around a guided
// starting point, and a collection of what's been made with it.
export default async function CreatePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const subject = profile?.subject ?? "your subject";
  const grade = profile?.gradeBand ?? "your";
  const scaffold = `Make a 5-question worksheet on [topic] for a ${grade} ${subject} class, with an answer key.`;

  const artifacts = await listArtifacts(user.id);

  return (
    <main className="flex min-h-full flex-col gap-10 p-6 pb-10">
      <header className="flex flex-col gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
          The studio
        </p>
        <h1
          className="text-[26px] leading-tight font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Make something real for tomorrow&apos;s class.
        </h1>
        <p className="text-[15px] text-muted">
          Start from a crafted prompt, not a blank chatbox. What comes back
          is a draft you own and review — never a final answer.
        </p>
      </header>

      <Card className="flex flex-col gap-4">
        <h2
          className="text-[13px] font-bold uppercase tracking-wide text-brand-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Playground
        </h2>
        <Playground scaffold={scaffold} mode="playground" />
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            className="text-[19px] font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            My Toolkit
          </h2>
          {artifacts.length > 0 && (
            <p className="text-right text-[13px] font-bold text-success-ink">
              {formatHoursSaved(totalMinutesSaved(artifacts))} saved
              <span className="ml-1 font-normal text-faint">(est.)</span>
            </p>
          )}
        </div>

        {artifacts.length === 0 ? (
          <p className="text-muted">
            Your first creation will live here. Make something in the
            studio above and it&apos;s yours to keep.
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
