export function easeOutCubic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 3);
}

export function countUpValue(from: number, to: number, progress: number): number {
  const eased = easeOutCubic(progress);
  return Math.round(from + (to - from) * eased);
}
