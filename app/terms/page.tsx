import Link from "next/link";

export const metadata = { title: "Terms of Service — SahajAiVidya" };

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-6 text-[15px] leading-relaxed">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Terms of Service
      </h1>
      <p className="text-sm text-muted">Last updated 21 August 2026</p>

      <p>
        By using SahajAiVidya, you agree to these terms. It&apos;s a pilot
        product, offered free to help educators build AI &amp; tech confidence.
      </p>

      <Section title="Your account">
        <p>
          You sign in with Google. You&apos;re responsible for activity under
          your account. Please use it for teaching-related learning only.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>
          Don&apos;t misuse the service or the AI features. In particular,{" "}
          <b>do not enter students&apos; personal or private information</b> into
          the AI playground, and don&apos;t use the app for anything unlawful.
        </p>
      </Section>

      <Section title="AI-generated content">
        <p>
          The AI can be confidently wrong. Anything it produces is a{" "}
          <b>draft for you to review</b> — you remain the expert responsible for
          checking accuracy, appropriateness, and fit before using it with
          students. We don&apos;t guarantee the accuracy of AI output.
        </p>
      </Section>

      <Section title="No warranty & limitation of liability">
        <p>
          SahajAiVidya is provided &ldquo;as is&rdquo;, without warranties of any
          kind. As a free pilot, we aren&apos;t liable for any loss or damage
          arising from your use of the app or reliance on AI-generated content.
        </p>
      </Section>

      <Section title="Changes & ending the service">
        <p>
          Being a pilot, the service may change or end. We may update these terms;
          continued use means you accept the changes. You can stop using it at
          any time.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions? Email{" "}
          <a href="mailto:prashantpps09@gmail.com" className="font-bold underline">
            prashantpps09@gmail.com
          </a>
          . See also our{" "}
          <Link href="/privacy" className="font-bold underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Link href="/login" className="pt-2 font-bold text-brand-ink underline">
        ← Back
      </Link>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
      <div className="text-muted">{children}</div>
    </section>
  );
}
