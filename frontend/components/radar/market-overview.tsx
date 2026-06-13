import type { RadarItem, Signal } from "@/lib/api";
import { buildMarketOverview, marketModeColor } from "@/lib/market-intelligence";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MarketOverviewProps {
  items: RadarItem[];
  signals: Signal[];
}

export function MarketOverview({ items, signals }: MarketOverviewProps) {
  const overview = buildMarketOverview(items, signals);

  const stats = [
    { label: "Tracked Assets", value: overview.trackedAssets },
    { label: "Active Signals", value: overview.activeSignals },
    { label: "Average Anomaly Score", value: overview.avgScore },
    { label: "Critical Signals", value: overview.criticalSignals },
  ];

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">Market Overview</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-5">
              <p className="text-[11px] uppercase tracking-wider text-radar-muted">{stat.label}</p>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-cmc-text">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="py-5">
            <p className="text-[11px] uppercase tracking-wider text-radar-muted">Market Mode</p>
            <p
              className={cn(
                "mt-2 inline-flex rounded border px-3 py-1.5 font-mono text-sm font-semibold tracking-wide",
                marketModeColor(overview.marketMode)
              )}
            >
              {overview.marketMode}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
