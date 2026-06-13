"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PriceChart } from "@/components/charts/price-chart";
import { ReplayScoreChart } from "@/components/charts/replay-score-chart";
import { VolumeChart } from "@/components/charts/volume-chart";
import { NarrativeBlock } from "@/components/radar/narrative-block";
import { ScoreBreakdownCard } from "@/components/radar/score-breakdown";
import { ScoreDisplay } from "@/components/radar/score-display";
import { SignalTimeline } from "@/components/radar/signal-timeline";
import { Card, CardContent } from "@/components/ui/card";
import { LiveSyncBadge } from "@/components/ui/live-sync-badge";
import { api, type AssetDetail, type MarketSnapshot, type ReplayPoint } from "@/lib/api";
import {
  formatPercent,
  formatPrice,
  formatVolume,
  percentColor,
  severityFromScore,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 60_000;

export default function AssetDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();

  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [replayPoints, setReplayPoints] = useState<ReplayPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [assetDetail, snapshotData, replayData] = await Promise.all([
          api.getAsset(symbol),
          api.getSnapshots(symbol),
          api.getReplay(symbol).catch(() => [] as ReplayPoint[]),
        ]);
        setDetail(assetDetail);
        setSnapshots(snapshotData);
        setReplayPoints(replayData);
        setLastSyncedAt(new Date());
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
    const id = setInterval(() => loadData(true), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loadData]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-radar-muted">Loading {symbol}...</p>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-terminal-red">Error: {error || "Asset not found"}</p>
        <Link href="/radar" className="text-terminal-blue hover:underline">
          ← Back to Radar
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
            ← Market Terminal
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/replay?symbol=${detail.asset.symbol}`}
              className="text-sm text-terminal-blue hover:underline"
            >
              Signal Replay →
            </Link>
            <LiveSyncBadge assetCount={1} lastSyncedAt={lastSyncedAt} refreshing={loading && !!detail} />
          </div>
        </div>

        {/* Section 1: Asset Header */}
        <header className="terminal-panel mb-8 p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-mono text-3xl font-bold text-cmc-text">{detail.asset.name}</h1>
                <span className="rounded border border-radar-border bg-radar-elevated px-2 py-0.5 font-mono text-sm text-terminal-blue">
                  {detail.asset.symbol}
                </span>
                {detail.asset.rank && (
                  <span className="font-mono text-sm text-radar-muted">Rank #{detail.asset.rank}</span>
                )}
              </div>
              <div className="mt-3">
                <NarrativeBlock narrative={detail.narrative} variant="compact" />
              </div>
            </div>
            <ScoreDisplay score={detail.anomaly_score} size="xl" />
          </div>

          <div className="mt-6 grid gap-4 border-t border-radar-border pt-6 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCell label="Price" value={formatPrice(snapshot?.price)} />
            <MetricCell
              label="24h Change"
              value={formatPercent(snapshot?.percent_change_24h)}
              valueClass={percentColor(snapshot?.percent_change_24h)}
            />
            <MetricCell label="Market Cap" value={formatVolume(snapshot?.market_cap)} />
            <MetricCell label="Volume 24h" value={formatVolume(snapshot?.volume_24h)} />
            <MetricCell
              label="Composite Score"
              value={String(detail.anomaly_score)}
              valueClass={severityFromScore(detail.anomaly_score) === "critical" ? "text-terminal-red" : undefined}
            />
          </div>
        </header>

        {/* Section 2: Current Narrative */}
        <section className="mb-8">
          <h2 className="section-label mb-4">Current Narrative</h2>
          <NarrativeBlock narrative={detail.narrative} />
        </section>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Section 3: Score Breakdown */}
          <section>
            <h2 className="section-label mb-4">Score Breakdown</h2>
            <Card>
              <CardContent className="py-5">
                <ScoreBreakdownCard breakdown={detail.score_breakdown} />
              </CardContent>
            </Card>
          </section>

          {/* Section 4: Signal Timeline */}
          <section>
            <h2 className="section-label mb-4">Signal Timeline</h2>
            <Card>
              <CardContent className="py-5">
                <SignalTimeline signals={detail.signal_timeline} />
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Section 5: Charts */}
        <section>
          <h2 className="section-label mb-4">Market Charts</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartPanel title="Price">
              <PriceChart snapshots={snapshots} />
            </ChartPanel>
            <ChartPanel title="Volume">
              <VolumeChart snapshots={snapshots} />
            </ChartPanel>
          </div>
          {replayPoints.length > 0 && (
            <div className="mt-6">
              <ChartPanel title="Score History">
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
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-radar-muted">{label}</p>
      <p className={cn("mt-1 font-mono text-lg font-semibold tabular-nums text-cmc-text", valueClass)}>
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
