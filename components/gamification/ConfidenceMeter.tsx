export function ConfidenceMeter({
  value,
  label = "Your AI confidence",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {label}
        </span>
        <span className="text-sm font-extrabold tabular-nums text-success-ink">
          {value}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          🌱
        </span>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunk">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${value}%`,
              background:
                "linear-gradient(90deg, var(--green), var(--amber))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
