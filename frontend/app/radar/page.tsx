"use client";

import Link from "next/link";
import { AnomalyTable } from "@/components/radar/anomaly-table";
import { IntelligenceFeed } from "@/components/radar/intelligence-feed";
import { MarketOverview } from "@/components/radar/market-overview";
import { TopOpportunities } from "@/components/radar/top-opportunities";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { LiveSyncBadge } from "@/components/ui/live-sync-badge";
import { api } from "@/lib/api";
import { usePolling } from "@/lib/hooks/use-polling";

export default function RadarPage() {
  const { data: items, loading, error, lastSyncedAt } = usePolling(() => api.getRadar(), 60_000);
  const { data: signals } = usePolling(() => api.getSignals(), 60_000);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4 border-b border-radar-border pb-6">
          <div>
            <Link href="/" className="text-sm text-radar-muted hover:text-terminal-blue">
              ← Home
            </Link>
            <h1 className="mt-3 font-mono text-2xl font-bold tracking-tight text-cmc-text sm:text-3xl">
              Market Intelligence Terminal
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DataSourceBadge />
            </div>
            <p className="mt-2 max-w-xl text-sm text-cmc-muted">
              Real-time anomaly detection and market narrative across tracked crypto assets.
            </p>
            <div className="mt-3 flex gap-4 text-sm">
              <Link href="/replay" className="text-terminal-blue hover:underline">
                Signal Replay →
              </Link>
            </div>
          </div>
          <LiveSyncBadge
            assetCount={items?.length ?? 0}
            lastSyncedAt={lastSyncedAt}
            refreshing={loading && !!items}
          />
        </header>

        {loading && !items && (
          <p className="text-cmc-muted">Initializing market intelligence...</p>
        )}
        {error && <p className="text-terminal-red">Error: {error}</p>}

        {items && (
          <>
            <MarketOverview items={items} signals={signals ?? []} />
            <TopOpportunities items={items} />
            <IntelligenceFeed signals={signals ?? []} />

            <section className="mt-10">
              <h2 className="section-label mb-4">Full Radar Table</h2>
              <p className="mb-4 text-sm text-cmc-muted">
                Complete market scan — composite score ranks all tracked assets.
              </p>
              <AnomalyTable items={items} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
