export function ProgressDots({
  total,
  current,
}: {
  total: number;
  /** 0-indexed current step; dots up to and including it are filled. */
  current: number;
}) {
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={Math.min(current + 1, total)}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-5 rounded-full ${i <= current ? "bg-brand" : "bg-line-2"}`}
        />
      ))}
    </div>
  );
}
