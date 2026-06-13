import Link from "next/link";
import type { RadarItem } from "@/lib/api";
import {
  formatPercent,
  formatPrice,
  formatVolume,
  percentColorStrong,
  rowHighlightClass,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { StatusBadge } from "./status-badge";

interface AnomalyTableProps {
  items: RadarItem[];
}

export function AnomalyTable({ items }: AnomalyTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-radar-border bg-radar-card shadow-terminal">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-radar-border bg-radar-elevated/50 text-[11px] uppercase tracking-wider text-radar-muted">
          <tr>
            <th className="px-4 py-2.5 font-medium">Asset</th>
            <th className="px-4 py-2.5 text-right font-medium">Price</th>
            <th className="px-4 py-2.5 text-right font-medium">24h %</th>
            <th className="px-4 py-2.5 text-right font-medium">Volume 24h</th>
            <th className="px-4 py-2.5 text-right font-medium">Market Cap</th>
            <th className="px-4 py-2.5 text-center font-medium">Radar Score</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
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
                  <Link href={`/assets/${item.asset.symbol}`} className="group block min-w-[120px]">
                    <span className="block text-[15px] font-medium leading-snug text-cmc-text group-hover:text-terminal-blue">
                      {item.asset.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-radar-muted/70">
                      {item.asset.symbol}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-white">
                  {formatPrice(item.price)}
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
