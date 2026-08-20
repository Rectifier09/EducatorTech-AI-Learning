import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { listArtifacts, artifactTitle } from "@/lib/data/toolkit";
import { totalMinutesSaved, formatHoursSaved } from "@/lib/toolkit/timeSaved";
import { ArtifactCard } from "@/components/toolkit/ArtifactCard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ToolkitPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const artifacts = await listArtifacts(user.id);

  return (
    <main className="flex min-h-full flex-col gap-4 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        My Toolkit
      </h1>

      {artifacts.length > 0 && (
        <p className="text-sm font-bold text-success-ink">
          SahajAiVidya has saved you about{" "}
          {formatHoursSaved(totalMinutesSaved(artifacts))} so far.{" "}
          <span className="font-normal text-muted">(estimated)</span>
        </p>
      )}

      {artifacts.length === 0 ? (
        <p className="text-muted">
          Your first creation will live here. Make something in the playground
          and it&apos;s yours to keep.
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

      <Link href="/path" className="mt-auto pt-4">
        <Button variant="ghost">Back to path</Button>
      </Link>
    </main>
  );
}
