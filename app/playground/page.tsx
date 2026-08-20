import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { Playground } from "@/components/playground/Playground";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const subject = profile?.subject ?? "your subject";
  const grade = profile?.gradeBand ?? "your";
  const scaffold = `Make a 5-question worksheet on [topic] for a ${grade} ${subject} class, with an answer key.`;

  return (
    <main className="flex min-h-full flex-col gap-4 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Playground
      </h1>
      <p className="text-sm text-muted">
        Practice with real AI — edit the prompt (swap <code>[topic]</code>) and
        generate.
      </p>
      <Playground scaffold={scaffold} mode="playground" />
      <Link href="/path" className="mt-auto pt-4">
        <Button variant="ghost">Back to path</Button>
      </Link>
    </main>
  );
}
