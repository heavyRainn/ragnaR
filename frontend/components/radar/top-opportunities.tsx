import Link from "next/link";
import type { RadarItem } from "@/lib/api";
import {
  formatPercent,
  formatPrice,
  formatSignalType,
  percentColor,
  volumeRatioColor,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreDisplay } from "./score-display";

interface TopOpportunitiesProps {
  items: RadarItem[];
}

export function TopOpportunities({ items }: TopOpportunitiesProps) {
  const top = items.filter((i) => i.anomaly_score > 0).slice(0, 5);
  if (top.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">Top Opportunities</h2>
      <div className="space-y-3">
        {top.map((item, rank) => (
          <Link key={item.asset.id} href={`/assets/${item.asset.symbol}`}>
            <Card className="group cursor-pointer transition-colors hover:border-terminal-blue/30">
              <CardContent className="flex items-center gap-4 py-4">
                <span className="hidden w-6 font-mono text-sm text-radar-muted sm:block">
                  {rank + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-cmc-text group-hover:text-terminal-blue">
                      {item.asset.name}
                    </span>
                    <span className="font-mono text-xs text-radar-muted">{item.asset.symbol}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
                    <span className="text-cmc-text">{formatPrice(item.price)}</span>
                    <span className={percentColor(item.percent_change_24h)}>
                      {formatPercent(item.percent_change_24h)}
                    </span>
                    <span className="text-radar-muted">
                      {formatSignalType(item.main_signal)}
                    </span>
                    <span className={volumeRatioColor(item.volume_ratio)}>
                      {item.volume_ratio !== null ? `${item.volume_ratio.toFixed(1)}x vol` : "—"}
                    </span>
                    {item.move_after_signal_percent != null && (
                      <span className={percentColor(item.move_after_signal_percent)}>
                        After Signal: {formatPercent(item.move_after_signal_percent)}
                      </span>
                    )}
                  </div>
                </div>
                <ScoreDisplay score={item.anomaly_score} size="lg" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
