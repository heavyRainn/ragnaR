import Link from "next/link";
import type { Signal } from "@/lib/api";
import { formatSignalType, formatTime } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScoreBadge } from "./score-badge";

interface IntelligenceFeedProps {
  signals: Signal[];
}

export function IntelligenceFeed({ signals }: IntelligenceFeedProps) {
  const feed = signals.slice(0, 12);

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">Market Intelligence Feed</h2>
      <Card>
        <CardHeader>
          <p className="text-sm text-cmc-muted">Live anomaly events across tracked assets</p>
        </CardHeader>
        <CardContent className="divide-y divide-radar-border p-0">
          {feed.length === 0 ? (
            <p className="px-5 py-8 text-sm text-cmc-muted">No active market events.</p>
          ) : (
            feed.map((signal) => (
              <Link
                key={`${signal.id}-${signal.signal_type}`}
                href={`/assets/${signal.asset_symbol}`}
                className="flex gap-4 px-5 py-4 transition-colors hover:bg-radar-elevated/50"
              >
                <span className="w-12 shrink-0 font-mono text-sm tabular-nums text-radar-muted">
                  {formatTime(signal.created_at)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-terminal-blue">
                      {signal.asset_symbol}
                    </span>
                    <span className="text-sm font-medium text-cmc-text">
                      {formatSignalType(signal.signal_type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-cmc-muted">
                    {signal.feed_description ?? "Anomaly pattern detected"}
                  </p>
                </div>
                <ScoreBadge score={signal.score} severity={signal.severity} className="shrink-0" />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
