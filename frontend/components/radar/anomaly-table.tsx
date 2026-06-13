import Link from "next/link";
import type { RadarItem } from "@/lib/api";
import {
  formatPercent,
  formatPrice,
  formatSignalType,
  formatVolume,
  percentColor,
  volumeRatioColor,
} from "@/lib/format";
import { ScoreBadge } from "./score-badge";

interface AnomalyTableProps {
  items: RadarItem[];
}

export function AnomalyTable({ items }: AnomalyTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-radar-border bg-radar-card shadow-terminal">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="border-b border-radar-border bg-radar-elevated/50 text-[11px] uppercase tracking-wider text-radar-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">24h %</th>
            <th className="px-4 py-3 text-right font-medium">Volume 24h</th>
            <th className="px-4 py-3 text-right font-medium">Market Cap</th>
            <th className="px-4 py-3 text-center font-medium">Composite</th>
            <th className="px-4 py-3 font-medium">Main Signal</th>
            <th className="px-4 py-3 text-right font-medium">Vol Ratio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-radar-border">
          {items.map((item) => (
            <tr key={item.asset.id} className="transition-colors hover:bg-radar-elevated/40">
              <td className="px-4 py-3">
                <Link href={`/assets/${item.asset.symbol}`} className="group block">
                  <span className="font-medium text-cmc-text group-hover:text-terminal-blue">
                    {item.asset.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-radar-muted">
                    {item.asset.symbol}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-cmc-text">
                {formatPrice(item.price)}
              </td>
              <td
                className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${percentColor(item.percent_change_24h)}`}
              >
                {formatPercent(item.percent_change_24h)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-cmc-text">
                {formatVolume(item.volume_24h)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-cmc-text">
                {formatVolume(item.market_cap)}
              </td>
              <td className="px-4 py-3 text-center">
                <ScoreBadge score={item.anomaly_score} severity={item.severity} />
              </td>
              <td className="px-4 py-3 text-cmc-text">{formatSignalType(item.main_signal)}</td>
              <td
                className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${volumeRatioColor(item.volume_ratio)}`}
              >
                {item.volume_ratio !== null ? `${item.volume_ratio.toFixed(2)}x` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
