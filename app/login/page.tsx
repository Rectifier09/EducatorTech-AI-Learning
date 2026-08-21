import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { MascotGuide } from "@/components/brand/MascotGuide";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <main className="flex min-h-full flex-col justify-between gap-8 p-6">
      <div className="pt-4">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Sahaj<span className="text-[color:var(--green-ink)]">AiVidya</span>
          </span>
        </div>

        <h1
          className="text-[28px] leading-tight font-semibold text-balance"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Make tomorrow&apos;s lesson in 5 minutes — and understand the AI doing it.
        </h1>
        <p className="mt-3 text-[15px] text-muted">
          Short, friendly lessons built for teachers. No tech background needed. Free.
        </p>

        <ul className="mt-6 flex flex-col gap-2.5 text-[14px] font-semibold">
          <li className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3">
            <Pill className="bg-brand-soft text-brand-ink">Learn</Pill> how AI really works
          </li>
          <li className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3">
            <Pill className="bg-accent-soft text-accent-ink">Make</Pill> real classroom material
          </li>
          <li className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3">
            <Pill className="bg-success-soft text-success-ink">Keep</Pill> everything you create
          </li>
        </ul>

        <div className="mt-8">
          <MascotGuide mood="welcome" caption="Welcome, colleague. Let's get you started." />
        </div>
      </div>

      <div>
        <GoogleSignInButton />
        <p className="mt-2.5 text-center text-[12px] text-muted">
          Takes about 15 minutes · free · your first worksheet&apos;s on us
        </p>
        <p className="mt-2 text-center text-[11px] text-muted">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="underline">
            Terms
          </Link>
        </p>
      </div>
    </main>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold ${className}`}>
      {children}
    </span>
  );
}
