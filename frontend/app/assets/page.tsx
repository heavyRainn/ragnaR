"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CryptoBubblesView } from "@/components/assets/crypto-bubbles-view";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { FreshnessSyncBadge } from "@/components/ui/freshness-sync-badge";
import { api } from "@/lib/api";
import { isBubbleEligibleItem } from "@/lib/assets-filters";
import type { BubbleViewMode } from "@/lib/bubble-layout";
import { useI18n } from "@/lib/i18n/locale-provider";
import { usePolling } from "@/lib/hooks/use-polling";
import { cn } from "@/lib/utils";

export default function AssetsPage() {
  const { t } = useI18n();
  const { data: items, loading, error } = usePolling(() => api.getRadar(), 60_000);
  const { data: signals } = usePolling(() => api.getSignals(), 60_000);
  const { data: systemStatus } = usePolling(() => api.getSystemStatus(), 15_000);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<BubbleViewMode>("24h");

  const viewModes: { id: BubbleViewMode; label: string }[] = [
    { id: "1h", label: t("assets.view1h") },
    { id: "24h", label: t("assets.view24h") },
    { id: "performance", label: t("assets.viewPerf") },
    { id: "radar", label: t("assets.viewRadar") },
  ];

  const signalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const signal of signals ?? []) {
      const sym = signal.asset_symbol;
      if (!sym) continue;
      counts[sym] = (counts[sym] ?? 0) + 1;
    }
    return counts;
  }, [signals]);

  const tradableItems = useMemo(() => {
    if (!items) return [];
    return items.filter(isBubbleEligibleItem);
  }, [items]);

  return (
    <main className="min-h-screen bg-radar-bg">
      <div className="mx-auto max-w-[100%]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-radar-border px-3 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-sans text-lg font-bold text-cmc-text sm:text-xl">{t("assets.title")}</h1>
            <DataSourceBadge />
            <FreshnessSyncBadge
              status={systemStatus ?? null}
              assetCount={tradableItems.length}
              refreshing={loading && !!items}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-radar-border bg-radar-card/60 p-0.5">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    "rounded px-2.5 py-1 font-sans text-xs font-semibold uppercase tracking-wide transition-colors",
                    viewMode === mode.id
                      ? "bg-terminal-blue/20 text-terminal-blue"
                      : "text-radar-muted hover:text-cmc-text"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <input
              type="search"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[140px] rounded-md border border-radar-border bg-radar-card/60 px-3 py-1.5 font-sans text-sm text-cmc-text placeholder:text-radar-muted focus:border-terminal-blue/50 focus:outline-none sm:w-[180px]"
            />

            <Link
              href="/radar"
              className="hidden font-sans text-xs text-radar-muted hover:text-cmc-text sm:inline"
            >
              {t("nav.terminal")} →
            </Link>
          </div>
        </header>

        {loading && !items && (
          <p className="py-20 text-center text-radar-muted">{t("assets.loading")}</p>
        )}
        {error && (
          <p className="py-8 text-center text-terminal-red">
            {t("common.error")}: {error}
          </p>
        )}

        {tradableItems.length > 0 && (
          <CryptoBubblesView
            items={tradableItems}
            search={search}
            viewMode={viewMode}
            showSectors={false}
            signalCounts={signalCounts}
          />
        )}

        {items && tradableItems.length === 0 && !loading && (
          <p className="py-20 text-center text-radar-muted">{t("assets.noTradable")}</p>
        )}
      </div>
    </main>
  );
}
