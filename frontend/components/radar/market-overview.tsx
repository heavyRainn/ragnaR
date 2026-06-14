"use client";

import type { RadarItem, Signal } from "@/lib/api";
import { buildMarketOverview, marketModeColor } from "@/lib/market-intelligence";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MarketOverviewProps {
  items: RadarItem[];
  signals: Signal[];
}

export function MarketOverview({ items, signals }: MarketOverviewProps) {
  const { t } = useI18n();
  const overview = buildMarketOverview(items, signals);

  const stats = [
    { label: t("radar.trackedAssets"), value: overview.trackedAssets },
    { label: t("radar.activeSignals"), value: overview.activeSignals },
    { label: t("radar.avgScore"), value: overview.avgScore },
    { label: t("radar.criticalSignals"), value: overview.criticalSignals },
  ];

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("radar.marketOverview")}</h2>
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
            <p className="text-[11px] uppercase tracking-wider text-radar-muted">{t("radar.marketMode")}</p>
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
