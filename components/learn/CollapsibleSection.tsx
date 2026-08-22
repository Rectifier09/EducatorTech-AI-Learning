"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * A luxurious expand/collapse section used on the Learn tabs (Your Journey
 * track headers, Explore branches). Height animates via the grid-rows
 * `0fr → 1fr` technique, so any content height eases smoothly with no fixed
 * max-height guesswork. Composes existing warm-dark @theme tokens only — no
 * new colours, fonts, or idioms. Honours prefers-reduced-motion.
 */
export function CollapsibleSection({
  title,
  emoji,
  subtitle,
  defaultOpen = true,
  titleClassName = "",
  children,
}: {
  title: string;
  emoji?: string;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  /** Extra classes for the title text (e.g. display font / larger size). */
  titleClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();

  return (
    <section className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="group flex w-full items-center gap-3 rounded-xl py-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className="min-w-0 flex-1">
          <span
            className={`flex items-center gap-2 text-[13px] font-bold text-ink ${titleClassName}`}
          >
            {emoji && <span aria-hidden="true">{emoji}</span>}
            <span className="truncate">{title}</span>
          </span>
          {subtitle && (
            <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide text-muted">
              {subtitle}
            </span>
          )}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className={`flex-none text-muted transition-transform duration-300 ease-out group-hover:text-ink motion-reduce:transition-none ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id={bodyId}
        className={`grid transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden" inert={!open ? true : undefined}>
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}
