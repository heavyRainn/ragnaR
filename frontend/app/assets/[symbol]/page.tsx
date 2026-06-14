"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CurrentStatus } from "@/components/asset/current-status";
import { EnhancedNarrativeCard } from "@/components/asset/enhanced-narrative-card";
import { KeyFindings } from "@/components/asset/key-findings";
import { SignalExplanations } from "@/components/asset/signal-explanations";
import { SignalHistory } from "@/components/asset/signal-history";
import { SignalOutcomeCard } from "@/components/asset/signal-outcome";
import { WhatChanged } from "@/components/asset/what-changed";
import { WhyFlagged } from "@/components/asset/why-flagged";
import { PriceChart } from "@/components/charts/price-chart";
import { ReplayScoreChart } from "@/components/charts/replay-score-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { ScoreBreakdownCard } from "@/components/radar/score-breakdown";
import { ScoreDisplay } from "@/components/radar/score-display";
import { SignalTimeline } from "@/components/radar/signal-timeline";
import { Card, CardContent } from "@/components/ui/card";
import { SnapshotFreshness } from "@/components/asset/snapshot-freshness";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { FreshnessSyncBadge } from "@/components/ui/freshness-sync-badge";
import { buildAssetExplanationContext } from "@/lib/asset-explanations";
import { api, type AssetDetail, type MarketSnapshot, type ReplayPoint, type SystemStatus } from "@/lib/api";
import { REQUIRED_SNAPSHOT_COUNT } from "@/lib/format";
import {
  formatPercent,
  formatPrice,
  formatVolume,
  percentColor,
  severityFromScore,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 60_000;

export default function AssetDetailPage() {
  const { t, signalLabel, formatDate } = useI18n();
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();

  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [replayPoints, setReplayPoints] = useState<ReplayPoint[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [assetDetail, snapshotData, replayData] = await Promise.all([
          api.getAsset(symbol),
          api.getSnapshots(symbol),
          api.getReplay(symbol).catch(() => ({
            symbol,
            points: [] as ReplayPoint[],
            snapshot_count: 0,
            required_snapshot_count: REQUIRED_SNAPSHOT_COUNT,
            quick_indices: null,
          })),
        ]);
        setDetail(assetDetail);
        setSnapshots(snapshotData);
        setReplayPoints(replayData.points);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [symbol]
  );

  useEffect(() => {
    loadData(false);
    const dataId = setInterval(() => loadData(true), REFRESH_INTERVAL_MS);
    const statusId = setInterval(() => {
      api.getSystemStatus().then(setSystemStatus).catch(() => setSystemStatus(null));
    }, 15_000);
    api.getSystemStatus().then(setSystemStatus).catch(() => setSystemStatus(null));
    return () => {
      clearInterval(dataId);
      clearInterval(statusId);
    };
  }, [loadData]);

  const explanation = useMemo(
    () =>
      detail
        ? buildAssetExplanationContext(detail, snapshots, replayPoints, {
            t,
            signalLabel,
            formatDate,
          })
        : null,
    [detail, snapshots, replayPoints, t, signalLabel, formatDate]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3">
        <AssetIdentity symbol={symbol} size="lg" layout="symbol" />
        <p className="text-radar-muted">{t("asset.loading")}</p>
      </main>
    );
  }

  if (error || !detail || !explanation) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-terminal-red">{t("common.error")}: {error || t("asset.notFound")}</p>
        <Link href="/radar" className="text-terminal-blue hover:underline">
          {t("common.backToRadar")}
        </Link>
      </main>
    );
  }

  const snapshot = detail.latest_snapshot;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/radar" className="text-sm text-radar-muted hover:text-terminal-blue">
            {t("common.backToTerminal")}
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/replay?symbol=${detail.asset.symbol}`}
              className="text-sm text-terminal-blue hover:underline"
            >
              {t("asset.signalReplay")}
            </Link>
            <FreshnessSyncBadge
              status={systemStatus}
              assetCount={1}
              refreshing={loading && !!detail}
            />
          </div>
        </div>

        <header className="terminal-panel mb-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <AssetIdentity
                  symbol={detail.asset.symbol}
                  name={detail.asset.name}
                  size="xl"
                  layout="row"
                  nameClassName="!font-mono"
                />
                {detail.asset.rank && (
                  <span className="font-mono text-sm text-radar-muted">{t("common.rank", { rank: detail.asset.rank })}</span>
                )}
              </div>
            </div>
            {detail.anomaly_score > 0 ? (
              <ScoreDisplay score={detail.anomaly_score} size="xl" />
            ) : (
              <div className="text-right">
                <p className="font-mono text-sm font-semibold uppercase tracking-wide text-radar-muted">
                  {t("asset.noActiveAnomaly")}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 border-t border-radar-border pt-6 sm:grid-cols-2 lg:grid-cols-6">
            <MetricCell label={t("common.price")} value={formatPrice(snapshot?.price)} prominent />
            <MetricCell
              label={t("common.change1h")}
              value={formatPercent(snapshot?.percent_change_1h)}
              valueClass={percentColor(snapshot?.percent_change_1h)}
            />
            <MetricCell
              label={t("common.change24h")}
              value={formatPercent(snapshot?.percent_change_24h)}
              valueClass={percentColor(snapshot?.percent_change_24h)}
            />
            <MetricCell label={t("common.marketCap")} value={formatVolume(snapshot?.market_cap)} muted />
            <MetricCell label={t("common.volume24h")} value={formatVolume(snapshot?.volume_24h)} />
            <MetricCell
              label={t("asset.radarScore")}
              value={detail.anomaly_score > 0 ? String(detail.anomaly_score) : t("asset.noActiveAnomaly")}
              valueClass={
                detail.anomaly_score > 0 && severityFromScore(detail.anomaly_score) === "critical"
                  ? "text-terminal-red"
                  : detail.anomaly_score === 0
                    ? "text-radar-muted text-sm"
                    : undefined
              }
            />
          </div>
          <SnapshotFreshness
            capturedAt={snapshot?.captured_at}
            systemStatus={systemStatus}
          />
        </header>

        <CurrentStatus detail={detail} context={explanation} />
        <SignalHistory signals={detail.historical_signals ?? []} symbol={detail.asset.symbol} />
        <SignalExplanations context={explanation} />
        {detail.signal_outcome && explanation.hasActiveAnomaly && (
          <SignalOutcomeCard outcome={detail.signal_outcome} />
        )}
        <WhyFlagged context={explanation} />

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <KeyFindings context={explanation} />
          <WhatChanged context={explanation} />
        </div>

        <EnhancedNarrativeCard context={explanation} />

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="section-label mb-4">{t("asset.scoreBreakdown")}</h2>
            <Card>
              <CardContent className="py-5">
                <ScoreBreakdownCard breakdown={detail.score_breakdown} />
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="section-label mb-4">{t("asset.signalTimeline")}</h2>
            <Card>
              <CardContent className="py-5">
                <SignalTimeline signals={detail.signal_timeline} />
              </CardContent>
            </Card>
          </section>
        </div>

        <section>
          <h2 className="section-label mb-4">{t("asset.marketCharts")}</h2>
          <p className="mb-4 text-sm text-cmc-muted">{t("asset.marketChartsHint")}</p>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartPanel title={t("common.price")}>
              <PriceChart snapshots={snapshots} markers={explanation.chartMarkers} />
            </ChartPanel>
            <ChartPanel title={t("common.volume24h")}>
              <VolumeChart snapshots={snapshots} markers={explanation.chartMarkers} />
            </ChartPanel>
          </div>
          {replayPoints.length > 0 && (
            <div className="mt-6">
              <ChartPanel title={t("replay.scoreEvolution")}>
                <ReplayScoreChart points={replayPoints} />
              </ChartPanel>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCell({
  label,
  value,
  valueClass,
  prominent,
  muted,
}: {
  label: string;
  value: string;
  valueClass?: string;
  prominent?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-radar-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono tabular-nums",
          prominent ? "text-xl font-semibold text-white" : "text-lg font-semibold",
          muted ? "text-radar-muted" : "text-cmc-text",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-5">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-radar-muted">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}
