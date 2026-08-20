import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getSkillTree } from "@/lib/content/skilltree";
import { getNotifiedNodes } from "@/lib/data/notify";
import { SkillTree } from "@/components/explore/SkillTree";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tree = getSkillTree();
  const notified = await getNotifiedNodes(user.id);

  return (
    <main className="flex min-h-full flex-col gap-4 p-6">
      <h1
        className="text-xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Explore
      </h1>
      <SkillTree tree={tree} notified={notified} />
      <Link href="/path" className="mt-auto pt-2">
        <Button variant="ghost">Back to path</Button>
      </Link>
    </main>
  );
}
