export function AnswerFeedback({
  state,
  correctLine = "Exactly.",
}: {
  state: "correct" | "notyet" | null;
  correctLine?: string;
}) {
  if (state === null) return null;

  if (state === "correct") {
    return (
      <p
        className="text-[16px] font-semibold text-success-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {correctLine}
      </p>
    );
  }

  return (
    <p className="text-[14px] font-bold text-[color:var(--coral)]">
      Not quite — look again.
    </p>
  );
}
