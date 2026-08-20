import { redirect } from "next/navigation";
import { getSessionUser, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

// TEMPORARY — Task 7 turns this into the routing hub
// (login / onboarding / path). For now it proves auth works end-to-end.
export default async function Home() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-full flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        Signed in ✓
      </h1>
      <div className="rounded-xl border border-line bg-surface p-4 text-sm">
        <p><span className="text-muted">name:</span> {user.name ?? "—"}</p>
        <p><span className="text-muted">email:</span> {user.email}</p>
        <p className="mt-1 break-all text-xs text-muted">id: {user.id}</p>
      </div>
      <form action={signOut}>
        <Button variant="ghost" type="submit">Sign out</Button>
      </form>
    </main>
  );
}
