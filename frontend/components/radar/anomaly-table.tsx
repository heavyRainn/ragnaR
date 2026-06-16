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

function MobileAssetRow({ item }: { item: RadarItem }) {
  const { t } = useI18n();
  const hasScore = item.anomaly_score > 0;

  return (
    <Link
      href={`/assets/${item.asset.symbol}`}
      className={cn(
        "block px-4 py-3 transition-colors active:bg-radar-elevated/50",
        hasScore ? rowHighlightClass(item.anomaly_score) : "hover:bg-radar-elevated/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <AssetIdentity
          symbol={item.asset.symbol}
          name={item.asset.name}
          size="sm"
          layout="row"
          className="min-w-0 flex-1"
        />
        {hasScore ? (
          <ScoreBadge score={item.anomaly_score} severity={item.severity} />
        ) : (
          <span className="font-mono text-xs text-radar-muted/50">—</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-radar-muted">{t("radar.tablePrice")}</p>
          <p className="mt-0.5 font-semibold tabular-nums text-cmc-text">{formatPrice(item.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-radar-muted">{t("radar.tableStatus")}</p>
          <div className="mt-0.5 flex justify-end">
            <StatusBadge item={item} className="max-w-none" />
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-radar-muted">{t("radar.tableChange1h")}</p>
          <p className={cn("mt-0.5 font-semibold tabular-nums", percentColorStrong(item.percent_change_1h))}>
            {formatPercent(item.percent_change_1h)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-radar-muted">{t("radar.tableChange24h")}</p>
          <p className={cn("mt-0.5 font-semibold tabular-nums", percentColorStrong(item.percent_change_24h))}>
            {formatPercent(item.percent_change_24h)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-radar-muted">{t("radar.tableVolume")}</p>
          <p className="mt-0.5 tabular-nums text-cmc-text/90">{formatVolume(item.volume_24h)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-radar-muted">{t("radar.tableMcap")}</p>
          <p className="mt-0.5 tabular-nums text-radar-muted">{formatVolume(item.market_cap)}</p>
        </div>
      </div>
    </Link>
  );
}

export function AnomalyTable({ items }: AnomalyTableProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden rounded-lg border border-radar-border bg-radar-card shadow-terminal">
        <div className="divide-y divide-radar-border/60">
          {items.map((item) => (
            <MobileAssetRow key={item.asset.id} item={item} />
          ))}
        </div>
      </div>

      {/* Desktop: scrollable table */}
      <div className="hidden md:block min-w-0">
        <div className="-mx-2 overflow-x-auto overscroll-x-contain px-2 pb-1 lg:mx-0 lg:px-0 [scrollbar-gutter:stable]">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-radar-border bg-radar-card shadow-terminal">
              <table className="w-full min-w-[880px] text-left text-sm">
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
          </div>
        </div>
      </div>
    </>
  );
}
