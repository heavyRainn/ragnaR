"use client";

import Link from "next/link";
import { ScoreBadge } from "@/components/radar/score-badge";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { api, type RadarItem } from "@/lib/api";
import { formatPercent, formatPrice, formatSignalType, percentColor } from "@/lib/format";
import { usePolling } from "@/lib/hooks/use-polling";

export default function AssetsPage() {
  const { data: items, loading, error } = usePolling(() => api.getRadar(), 60_000);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-radar-border pb-6">
          <h1 className="font-mono text-2xl font-bold text-cmc-text sm:text-3xl">Assets</h1>
          <div className="mt-3">
            <DataSourceBadge />
          </div>
          <p className="mt-2 text-sm text-cmc-muted">
            All tracked crypto assets with latest market metrics and anomaly scores.
          </p>
        </header>

        {loading && !items && <p className="text-cmc-muted">Loading assets...</p>}
        {error && <p className="text-terminal-red">Error: {error}</p>}

        {items && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <AssetCard key={item.asset.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function AssetCard({ item }: { item: RadarItem }) {
  return (
    <Link href={`/assets/${item.asset.symbol}`}>
      <article className="terminal-panel terminal-panel-hover flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-medium text-cmc-text">{item.asset.name}</h2>
            <p className="font-mono text-xs text-radar-muted">
              {item.asset.symbol}
              {item.asset.rank ? ` · #${item.asset.rank}` : ""}
            </p>
          </div>
          <ScoreBadge score={item.anomaly_score} severity={item.severity} />
        </div>
        <div className="flex items-center justify-between font-mono text-sm">
          <span className="text-cmc-text">{formatPrice(item.price)}</span>
          <span className={percentColor(item.percent_change_24h)}>
            {formatPercent(item.percent_change_24h)}
          </span>
        </div>
        {item.main_signal && (
          <p className="text-xs text-radar-muted">{formatSignalType(item.main_signal)}</p>
        )}
      </article>
    </Link>
  );
}
