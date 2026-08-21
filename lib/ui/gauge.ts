/** Clamp a raw confidence value to an integer 0–100. */
export function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

/**
 * Geometry for a radial gauge drawn on an SVG circle with pathLength="100".
 * `sweep` is the visible arc as a fraction of 100 (75 => 270°).
 */
export function gaugeDash(
  value: number,
  sweep = 75,
): { track: string; value: string; valueLen: number } {
  const v = clampScore(value);
  const valueLen = Math.round(sweep * (v / 100) * 100) / 100;
  return {
    track: `${sweep} 100`,
    value: `${valueLen} 100`,
    valueLen,
  };
}
