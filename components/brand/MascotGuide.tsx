type Mood = "welcome" | "cheer" | "reassure";

/**
 * Ravi — the pilot's single educator-guide. A restrained, tokenized inline
 * SVG portrait (skin/hair map to --skin/--hair); real illustrated art is a
 * later, post-approval design task (see public/mascots/README.md).
 */
export function MascotGuide({
  mood = "welcome",
  caption,
  size = 56,
}: {
  mood?: Mood;
  caption?: string;
  size?: number;
}) {
  return (
    <div className="flex items-end gap-3">
      <RaviPortrait size={size} title={`Ravi (${mood})`} />
      {caption ? (
        <p className="max-w-[16rem] rounded-2xl rounded-bl-sm border border-line bg-surface px-4 py-3 text-sm leading-snug text-ink shadow-[var(--elev-1)]">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

function RaviPortrait({ size, title }: { size: number; title: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      className="shrink-0 rounded-full"
    >
      <circle
        cx="48"
        cy="48"
        r="46.5"
        fill="var(--surface-2)"
        stroke="var(--gold)"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <path
        d="M22 96c2-17 12-27 26-27s24 10 26 27H22Z"
        fill="var(--sunk)"
      />
      <path d="M40 62h16v10a8 8 0 0 1-16 0V62Z" fill="var(--skin)" />
      <circle cx="48" cy="46" r="21" fill="var(--skin)" />
      <path
        d="M27 45c-1-14 9-23 21-23s22 9 21 23c-3-2-4-6-4-10-5 5-13 6-24 6-4 0-7 2-8 6-2-1-4 0-6 2Z"
        fill="var(--hair)"
      />
      <g fill="none" stroke="var(--ink)" strokeWidth="2">
        <circle cx="40" cy="47" r="5.5" />
        <circle cx="57" cy="47" r="5.5" />
        <path d="M45.5 46.5h6" strokeLinecap="round" />
      </g>
      <path
        d="M42 58c3 2.6 9 2.6 12 0"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
