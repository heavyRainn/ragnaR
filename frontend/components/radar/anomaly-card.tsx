import Link from "next/link";
import type { RadarItem } from "@/lib/api";
import {
  formatPercent,
  formatPrice,
  formatSignalType,
  percentColor,
  volumeRatioColor,
} from "@/lib/format";
import { ScoreBadge } from "./score-badge";

interface AnomalyCardProps {
  item: RadarItem;
}

export function AnomalyCard({ item }: AnomalyCardProps) {
  return (
    <Link
      href={`/assets/${item.asset.symbol}`}
      className="block rounded-lg border border-radar-border bg-radar-card p-4 transition hover:border-radar-accent/40 hover:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-cmc-text">{item.asset.name}</p>
          <p className="text-xs text-cmc-muted">{item.asset.symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-cmc-muted">Composite</p>
          <ScoreBadge score={item.anomaly_score} severity={item.severity} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <div>
          <p className="text-cmc-muted">Main Signal</p>
          <p className="text-cmc-text">{formatSignalType(item.main_signal)}</p>
        </div>
        <div>
          <p className="text-cmc-muted">Price</p>
          <p className="font-mono font-medium text-cmc-text">{formatPrice(item.price)}</p>
        </div>
        <div>
          <p className="text-cmc-muted">24h %</p>
          <p className={`font-mono font-semibold ${percentColor(item.percent_change_24h)}`}>
            {formatPercent(item.percent_change_24h)}
          </p>
        </div>
        <div>
          <p className="text-cmc-muted">Volume Ratio</p>
          <p className={`font-mono font-semibold ${volumeRatioColor(item.volume_ratio)}`}>
            {item.volume_ratio !== null ? `${item.volume_ratio.toFixed(2)}x` : "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}
