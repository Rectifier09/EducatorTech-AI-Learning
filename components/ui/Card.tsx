import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-line bg-surface p-5 shadow-[var(--elev-1)] ${className}`}
    >
      {children}
    </div>
  );
}
