"use client";

import { useMemo, useState } from "react";
import { AnomalyTable } from "@/components/radar/anomaly-table";
import { CapitalRotation } from "@/components/radar/capital-rotation";
import { IntelligenceFeed } from "@/components/radar/intelligence-feed";
import { MarketOverview } from "@/components/radar/market-overview";
import { MarketStoryBlock } from "@/components/radar/market-story";
import { OpportunityFeed } from "@/components/radar/opportunity-feed";
import { RadarTableControls } from "@/components/radar/radar-table-controls";
import { RecentMarketEvents } from "@/components/radar/recent-market-events";
import { TopActiveSignals } from "@/components/radar/top-active-signals";
import { TopOpportunities } from "@/components/radar/top-opportunities";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { FreshnessSyncBadge } from "@/components/ui/freshness-sync-badge";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/locale-provider";
import { usePolling } from "@/lib/hooks/use-polling";
import { DEFAULT_RADAR_FILTERS, filterAndSortRadarItems } from "@/lib/radar-filters";

export default function RadarPage() {
  const { t } = useI18n();
  const { data: items, loading, error } = usePolling(() => api.getRadar(), 60_000);
  const { data: signals } = usePolling(() => api.getSignals(), 60_000);
  const { data: recentEvents } = usePolling(() => api.getRecentMarketEvents(), 60_000);
  const { data: marketRotation } = usePolling(() => api.getMarketRotation(), 60_000);
  const { data: marketStory } = usePolling(() => api.getMarketStory(), 60_000);
  const { data: opportunities } = usePolling(() => api.getOpportunities(20), 60_000);
  const { data: systemStatus } = usePolling(() => api.getSystemStatus(), 15_000);
  const [filters, setFilters] = useState(DEFAULT_RADAR_FILTERS);

  const filteredItems = useMemo(
    () => (items ? filterAndSortRadarItems(items, filters) : []),
    [items, filters]
  );

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl min-w-0">
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4 border-b border-radar-border pb-6">
          <div>
            <h1 className="font-mono text-2xl font-bold tracking-tight text-cmc-text sm:text-3xl">
              {t("radar.title")}
            </h1>
            <p className="mt-3 font-mono text-base font-semibold text-terminal-blue sm:text-lg">
              {t("radar.capitalQuestion")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DataSourceBadge />
            </div>
            <p className="mt-2 max-w-xl text-sm text-cmc-muted">{t("radar.subtitle")}</p>
          </div>
          <FreshnessSyncBadge
            status={systemStatus}
            assetCount={items?.length ?? 0}
            refreshing={loading && !!items}
          />
        </header>

        {loading && !items && (
          <div className="space-y-6 animate-pulse">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-radar-elevated/60" />
              ))}
            </div>
            <div className="h-32 rounded-lg bg-radar-elevated/40" />
            <div className="h-48 rounded-lg bg-radar-elevated/30" />
            <p className="text-center text-sm text-radar-muted">{t("radar.initializing")}</p>
          </div>
        )}
        {error && (
          <p className="text-terminal-red">
            {t("common.error")}: {error}
          </p>
        )}

        {items && (
          <>
            <MarketOverview items={items} signals={signals ?? []} />
            <TopActiveSignals signals={signals ?? []} />
            <TopOpportunities items={items} />
            {marketStory && <MarketStoryBlock story={marketStory} />}
            {marketRotation && <CapitalRotation data={marketRotation} />}
            {opportunities && <OpportunityFeed items={opportunities} />}
            {recentEvents && <RecentMarketEvents events={recentEvents} />}
            <IntelligenceFeed signals={signals ?? []} />

            <section className="mt-10 min-w-0">
              <h2 className="section-label mb-4">{t("radar.fullTable")}</h2>
              <p className="mb-4 text-sm text-cmc-muted">
                {t("radar.fullTableHint", { count: items.length })}
              </p>
              <RadarTableControls
                filters={filters}
                onChange={setFilters}
                totalCount={items.length}
                filteredCount={filteredItems.length}
              />
              {filteredItems.length === 0 ? (
                <p className="rounded-lg border border-radar-border bg-radar-card p-8 text-center text-sm text-cmc-muted">
                  {t("radar.noFilterMatch")}{" "}
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_RADAR_FILTERS)}
                    className="text-terminal-blue hover:underline"
                  >
                    {t("common.resetFilters")}
                  </button>
                </p>
              ) : (
                <AnomalyTable items={filteredItems} />
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
