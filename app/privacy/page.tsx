import Link from "next/link";

export const metadata = { title: "Privacy Policy — SahajAiVidya" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 p-6 text-[15px] leading-relaxed">
      <h1
        className="text-2xl font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Privacy Policy
      </h1>
      <p className="text-sm text-muted">Last updated 21 August 2026</p>

      <p>
        SahajAiVidya is a pilot learning app that helps educators build
        confidence with AI &amp; tech. This policy explains what we collect and
        why, in plain language.
      </p>

      <Section title="What we collect">
        <ul className="list-disc pl-5">
          <li>
            <b>Your Google account basics</b> — name and email address, used to
            sign you in (via Google) and create your account.
          </li>
          <li>
            <b>Onboarding details you provide</b> — your role, subject, grade
            level, and a short self-rating of how you feel about AI.
          </li>
          <li>
            <b>Your learning activity</b> — lesson progress, exercise results,
            streaks, and reflections, so we can save your progress and improve
            the app.
          </li>
          <li>
            <b>What you create in the AI playground</b> — the prompts you write
            and the materials you generate and save to your Toolkit.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>
          To sign you in, save and personalize your learning, and — for this
          pilot — to understand whether the app helps educators build
          confidence. We do not sell your data or use it for advertising.
        </p>
      </Section>

      <Section title="AI features & third parties">
        <p>
          When you generate material in the playground, the prompt you write is
          sent to an AI provider (Google Gemini and/or Groq) to produce a
          response. On free tiers, providers may use submitted content to
          improve their services. <b>Please do not enter students&apos; personal
          details or any private information</b> into the AI.
        </p>
        <p className="mt-2">
          We use <b>Supabase</b> to store your account and learning data, and{" "}
          <b>Google</b> for sign-in. These providers process data on our behalf.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can stop using the app at any time. To access or delete your data,
          email us at{" "}
          <a href="mailto:prashantpps09@gmail.com" className="font-bold underline">
            prashantpps09@gmail.com
          </a>{" "}
          and we&apos;ll remove your account and associated data.
        </p>
      </Section>

      <Section title="Children">
        <p>
          SahajAiVidya is intended for educators (adults), not children. We do
          not knowingly collect data from children, and ask that you keep
          students&apos; personal information out of the app.
        </p>
      </Section>

      <Section title="Changes & contact">
        <p>
          We may update this policy as the product evolves; material changes will
          be noted here. Questions? Email{" "}
          <a href="mailto:prashantpps09@gmail.com" className="font-bold underline">
            prashantpps09@gmail.com
          </a>
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
