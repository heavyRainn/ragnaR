"use client";

import Link from "next/link";
import type { RadarItem } from "@/lib/api";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { useI18n } from "@/lib/i18n/locale-provider";
import {
  formatPercent,
  formatPrice,
  percentColor,
  volumeRatioColor,
} from "@/lib/format";
import { ScoreBadge } from "./score-badge";

interface AnomalyCardProps {
  item: RadarItem;
}

export function AnomalyCard({ item }: AnomalyCardProps) {
  const { t, signalLabel } = useI18n();

  return (
    <Link
      href={`/assets/${item.asset.symbol}`}
      className="block rounded-lg border border-radar-border bg-radar-card p-4 transition hover:border-radar-accent/40 hover:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3">
        <AssetIdentity symbol={item.asset.symbol} name={item.asset.name} size="md" layout="stacked" />
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-cmc-muted">{t("radar.composite")}</p>
          <ScoreBadge score={item.anomaly_score} severity={item.severity} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <div>
          <p className="text-cmc-muted">{t("radar.mainSignal")}</p>
          <p className="text-cmc-text">{signalLabel(item.main_signal)}</p>
        </div>
        <div>
          <p className="text-cmc-muted">{t("radar.tablePrice")}</p>
          <p className="font-mono font-medium text-cmc-text">{formatPrice(item.price)}</p>
        </div>
        <div>
          <p className="text-cmc-muted">{t("common.change1h")}</p>
          <p className={`font-mono font-semibold ${percentColor(item.percent_change_1h)}`}>
            {formatPercent(item.percent_change_1h)}
          </p>
        </div>
        <div>
          <p className="text-cmc-muted">{t("common.change24h")}</p>
          <p className={`font-mono font-semibold ${percentColor(item.percent_change_24h)}`}>
            {formatPercent(item.percent_change_24h)}
          </p>
        </div>
        <div>
          <p className="text-cmc-muted">{t("radar.volumeRatio")}</p>
          <p className={`font-mono font-semibold ${volumeRatioColor(item.volume_ratio)}`}>
            {item.volume_ratio !== null ? `${item.volume_ratio.toFixed(2)}x` : "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}
