export function nextCollapsed(
  scrollTop: number,
  prev: boolean,
  opts: { enter?: number; exit?: number } = {},
): boolean {
  const { enter = 72, exit = 36 } = opts;
  if (!prev && scrollTop > enter) return true;
  if (prev && scrollTop < exit) return false;
  return prev;
}
