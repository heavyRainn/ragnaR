"use client";

import type { ReactNode } from "react";
import type { RadarItem } from "@/lib/api";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { useI18n } from "@/lib/i18n/locale-provider";

interface RadarSummaryProps {
  items: RadarItem[];
}

export function RadarSummary({ items }: RadarSummaryProps) {
  const { t, signalLabel } = useI18n();
  const activeSignals = items.filter((i) => i.anomaly_score > 0).length;
  const avgScore =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.anomaly_score, 0) / items.length)
      : 0;
  const highest = items.reduce<RadarItem | null>(
    (best, item) => (!best || item.anomaly_score > best.anomaly_score ? item : best),
    null
  );

  const stats: { label: string; value: ReactNode }[] = [
    { label: t("radar.trackedAssets"), value: String(items.length) },
    { label: t("radar.activeSignals"), value: String(activeSignals) },
    { label: t("radar.avgAnomalyScore"), value: String(avgScore) },
    {
      label: t("radar.highestSignal"),
      value:
        highest && highest.anomaly_score > 0 ? (
          <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <AssetIdentity symbol={highest.asset.symbol} size="xs" layout="symbol" />
            <span className="truncate font-mono text-sm text-radar-muted">
              {signalLabel(highest.main_signal)} ({highest.anomaly_score})
            </span>
          </span>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-radar-border bg-radar-card px-4 py-3"
        >
          <p className="text-xs uppercase tracking-wider text-cmc-muted">{stat.label}</p>
          <div className="mt-1 truncate font-mono text-lg font-semibold text-cmc-text">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}
