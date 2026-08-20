import type {
  McqBlock,
  OrderBlock,
  FillBlankBlock,
} from "@/lib/content/types";

export function gradeMcq(
  block: Pick<McqBlock, "correctIds">,
  selectedIds: string[],
): boolean {
  const correct = new Set(block.correctIds);
  return (
    selectedIds.length === correct.size &&
    selectedIds.every((id) => correct.has(id))
  );
}

export function gradeOrder(
  block: Pick<OrderBlock, "correctOrder">,
  ordered: string[],
): boolean {
  return (
    ordered.length === block.correctOrder.length &&
    ordered.every((id, i) => id === block.correctOrder[i])
  );
}

export function gradeFillBlank(
  block: Pick<FillBlankBlock, "blanks">,
  choices: Record<string, number>,
): boolean {
  return block.blanks.every((b) => choices[b.id] === b.correctIndex);
}
