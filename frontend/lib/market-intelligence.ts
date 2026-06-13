import type { RadarItem, Signal } from "@/lib/api";

export type MarketMode = "NORMAL" | "ACTIVE" | "HIGH ATTENTION";

export function computeMarketMode(
  activeSignalCount: number,
  criticalCount: number
): MarketMode {
  if (criticalCount >= 3 || activeSignalCount >= 9) return "HIGH ATTENTION";
  if (activeSignalCount >= 3) return "ACTIVE";
  return "NORMAL";
}

export function marketModeColor(mode: MarketMode): string {
  switch (mode) {
    case "HIGH ATTENTION":
      return "text-terminal-red border-terminal-red/30 bg-terminal-red/10";
    case "ACTIVE":
      return "text-terminal-amber border-terminal-amber/30 bg-terminal-amber/10";
    default:
      return "text-terminal-neutral border-radar-border bg-radar-elevated";
  }
}

export function buildMarketOverview(items: RadarItem[], signals: Signal[]) {
  const activeSignalCount = signals.length;
  const criticalCount = signals.filter((s) => s.score >= 80).length;
  const avgScore =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.anomaly_score, 0) / items.length)
      : 0;

  return {
    trackedAssets: items.length,
    activeSignals: activeSignalCount,
    avgScore,
    criticalSignals: criticalCount,
    marketMode: computeMarketMode(activeSignalCount, criticalCount),
  };
}
