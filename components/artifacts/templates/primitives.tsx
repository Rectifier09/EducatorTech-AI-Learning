import type { ReactNode } from "react";

export function ArtifactHeading({ children }: { children: ReactNode }) {
  return (
    <h3
      className="text-[16px] font-semibold text-ink"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </h3>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-sunk px-2.5 py-0.5 text-[11px] font-bold text-muted">
      {children}
    </span>
  );
}

export function ListRow({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1 text-[14px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}
