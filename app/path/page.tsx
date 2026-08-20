import { redirect } from "next/navigation";
import { getSessionUser, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

// Placeholder — Phase 2 builds the real learning-path map here.
export default async function PathPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const first = user.name?.split(" ")[0] ?? "there";
  return (
    <main className="flex min-h-full flex-col gap-4 p-6">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Welcome, {first} 👋
      </h1>
      <p className="text-muted">
        Your learning path is coming next. (Placeholder — Phase 2 builds the
        lessons.)
      </p>
      <form action={signOut}>
        <Button variant="ghost" type="submit">
          Sign out
        </Button>
      </form>
    </main>
  );
}
