function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Visual typography & layout for bubble labels (scales via --bubble-r in CSS). */
export function bubbleLabelSize(radius: number, symbol = "") {
  const symLen = symbol.length;
  let symbolScale = 1;
  if (symLen >= 6) symbolScale = 0.62;
  else if (symLen === 5) symbolScale = 0.72;
  else if (symLen === 4) symbolScale = 0.86;

  return {
    iconTop: 19,
    symbolTop: 44,
    changeTop: 76,
    symbolScale,
    showIcon: radius >= 14,
    showSymbol: radius >= 12,
    showChange: radius >= 10,
  };
}

/** Fallback pixel sizes when CSS vars unavailable. */
export function bubbleLabelFallbackPx(radius: number, symbol = "") {
  const diameter = radius * 2;
  const labels = bubbleLabelSize(radius, symbol);

  let symbolSize = diameter * 0.3 * labels.symbolScale;
  return {
    icon: Math.round(clamp(diameter * 0.24, 20, 88)),
    symbol: Math.round(clamp(symbolSize, 28, 128)),
    change: Math.round(clamp(symbolSize * 0.36, 12, 48)),
    ...labels,
  };
}
