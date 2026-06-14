"use client";

import Link from "next/link";
import type { RadarItem } from "@/lib/api";
import { AssetIdentity } from "@/components/ui/asset-identity";
import {
  formatPercent,
  formatPrice,
  formatVolume,
  percentColorStrong,
  rowHighlightClass,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { StatusBadge } from "./status-badge";

interface AnomalyTableProps {
  items: RadarItem[];
}

export function AnomalyTable({ items }: AnomalyTableProps) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto rounded-lg border border-radar-border bg-radar-card shadow-terminal">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead className="border-b border-radar-border bg-radar-elevated/50 text-[11px] uppercase tracking-wider text-radar-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">{t("radar.tableAsset")}</th>
            <th className="px-4 py-2.5 text-right font-medium">{t("radar.tablePrice")}</th>
            <th className="px-4 py-2.5 text-right font-medium">{t("radar.tableChange1h")}</th>
            <th className="px-4 py-2.5 text-right font-medium">{t("radar.tableChange24h")}</th>
            <th className="px-4 py-2.5 text-right font-medium">{t("radar.tableVolume")}</th>
            <th className="px-4 py-2.5 text-right font-medium">{t("radar.tableMcap")}</th>
            <th className="px-4 py-2.5 text-center font-medium">{t("radar.tableScore")}</th>
            <th className="px-4 py-2.5 font-medium">{t("radar.tableStatus")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-radar-border/60">
          {items.map((item) => {
            const hasScore = item.anomaly_score > 0;
            return (
              <tr
                key={item.asset.id}
                className={cn(
                  "transition-colors",
                  hasScore ? rowHighlightClass(item.anomaly_score) : "hover:bg-radar-elevated/30"
                )}
              >
                <td className="px-4 py-2.5">
                  <Link href={`/assets/${item.asset.symbol}`} className="group block min-w-[140px]">
                    <AssetIdentity
                      symbol={item.asset.symbol}
                      name={item.asset.name}
                      size="md"
                      layout="stacked"
                      nameClassName="group-hover:text-terminal-blue"
                    />
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-white">
                  {formatPrice(item.price)}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums",
                    percentColorStrong(item.percent_change_1h)
                  )}
                >
                  {formatPercent(item.percent_change_1h)}
                </td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums",
                    percentColorStrong(item.percent_change_24h)
                  )}
                >
                  {formatPercent(item.percent_change_24h)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-cmc-text/90">
                  {formatVolume(item.volume_24h)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-radar-muted">
                  {formatVolume(item.market_cap)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {hasScore ? (
                    <ScoreBadge score={item.anomaly_score} severity={item.severity} />
                  ) : (
                    <span className="font-mono text-sm text-radar-muted/50">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge item={item} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
