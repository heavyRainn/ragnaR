"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { PriceChart } from "@/components/charts/price-chart";
import { api, type AssetDetail, type MarketSnapshot } from "@/lib/api";
import {
  formatPercent,
  formatPrice,
  formatSignalType,
  formatVolume,
  percentColor,
} from "@/lib/format";
import type { SimBubble } from "@/lib/bubble-physics";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface BubbleDetailModalProps {
  bubble: SimBubble;
  onClose: () => void;
}

export function BubbleDetailModal({ bubble, onClose }: BubbleDetailModalProps) {
  const { t, signalLabel } = useI18n();
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assetDetail, snapshotData] = await Promise.all([
        api.getAsset(bubble.symbol),
        api.getSnapshots(bubble.symbol),
      ]);
      setDetail(assetDetail);
      setSnapshots(snapshotData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load asset");
    } finally {
      setLoading(false);
    }
  }, [bubble.symbol]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const snapshot = detail?.latest_snapshot;
  const performance = [
    { label: t("common.change1h"), value: snapshot?.percent_change_1h ?? null },
    { label: t("common.change24h"), value: snapshot?.percent_change_24h ?? bubble.change24h },
    { label: "7D", value: snapshot?.percent_change_7d ?? null },
  ];

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bubble-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-[1] flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-radar-border bg-radar-card shadow-terminal">
        <header className="flex items-start justify-between gap-4 border-b border-radar-border px-5 py-4">
          <div id="bubble-modal-title" className="min-w-0">
            <AssetIdentity
              symbol={bubble.symbol}
              name={bubble.name}
              size="lg"
              layout="stacked"
              nameClassName="!text-lg !font-bold"
              symbolClassName="normal-case text-radar-muted"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-radar-border px-2.5 py-1 text-sm text-radar-muted transition-colors hover:bg-radar-bg hover:text-cmc-text"
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </header>

        {loading && (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-sm text-radar-muted">{t("bubble.modalLoading", { symbol: bubble.symbol })}</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
            <p className="text-sm text-terminal-red">{error}</p>
            <button
              type="button"
              onClick={load}
              className="rounded-md border border-radar-border px-3 py-1.5 text-sm text-cmc-text hover:bg-radar-bg"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-5 border-b border-radar-border p-5 lg:border-b-0 lg:border-r">
              <div>
                <p className="font-mono text-3xl font-bold tabular-nums text-cmc-text">
                  {formatPrice(snapshot?.price ?? bubble.price)}
                </p>
                <p className={cn("mt-1 font-mono text-sm font-semibold tabular-nums", percentColor(bubble.displayChange))}>
                  {formatPercent(bubble.displayChange)}
                </p>
              </div>

              <div>
                <p className="section-label mb-2">{t("common.performance")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {performance.map((cell) => (
                    <div
                      key={cell.label}
                      className="rounded-lg border border-radar-border bg-radar-bg/60 px-3 py-2 text-center"
                    >
                      <p className="text-[10px] uppercase tracking-wide text-radar-muted">{cell.label}</p>
                      <p className={cn("mt-0.5 font-mono text-sm font-semibold tabular-nums", percentColor(cell.value))}>
                        {formatPercent(cell.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="section-label mb-2">{t("common.marketStats")}</p>
                <dl className="space-y-2 font-mono text-xs">
                  <StatRow label={t("common.rankLabel")} value={detail?.asset.rank ? `#${detail.asset.rank}` : "—"} />
                  <StatRow label={t("common.marketCap")} value={formatVolume(snapshot?.market_cap ?? bubble.marketCapStr)} />
                  <StatRow label={t("common.volume24h")} value={formatVolume(snapshot?.volume_24h ?? null)} />
                  <StatRow label={t("common.sector")} value={bubble.sector} />
                  <StatRow
                    label={t("common.radarScore")}
                    value={detail?.anomaly_score ? String(detail.anomaly_score) : String(bubble.radarScore)}
                    highlight={(detail?.anomaly_score ?? bubble.radarScore) >= 60}
                  />
                  {bubble.mainSignal && (
                    <StatRow
                      label={t("common.mainSignal")}
                      value={signalLabel(bubble.mainSignal) || formatSignalType(bubble.mainSignal)}
                    />
                  )}
                </dl>
              </div>

              {detail?.narrative && (
                <div className="rounded-lg border border-radar-border bg-radar-bg/40 px-3 py-2.5">
                  <p className="section-label mb-1">{detail.narrative.title}</p>
                  <p className="text-xs leading-relaxed text-radar-muted">{detail.narrative.description}</p>
                </div>
              )}

              <Link
                href={`/assets/${bubble.symbol}`}
                className="inline-flex items-center justify-center rounded-lg border border-terminal-blue/40 bg-terminal-blue/10 px-4 py-2 text-sm font-semibold text-terminal-blue transition-colors hover:bg-terminal-blue/20"
              >
                {t("common.fullAnalysis")}
              </Link>
            </div>

            <div className="flex flex-col p-5">
              <p className="section-label mb-3">{t("common.priceHistory")}</p>
              <PriceChart snapshots={snapshots} className="h-56 sm:h-64" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-radar-muted">{label}</dt>
      <dd className={cn("font-semibold tabular-nums text-cmc-text", highlight && "text-terminal-amber")}>
        {value}
      </dd>
    </div>
  );
}
