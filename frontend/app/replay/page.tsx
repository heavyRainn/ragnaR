"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReplayScoreChart } from "@/components/charts/replay-score-chart";
import { NarrativeBlock } from "@/components/radar/narrative-block";
import { ScoreDisplay } from "@/components/radar/score-display";
import { ScoreBadge } from "@/components/radar/score-badge";
import { Card, CardContent } from "@/components/ui/card";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { useI18n } from "@/lib/i18n/locale-provider";
import { api, type Asset, type ReplayPoint, type ReplayQuickIndices } from "@/lib/api";
import {
  formatDate,
  formatPercent,
  formatPrice,
  formatVolume,
  percentColor,
} from "@/lib/format";
import { chartVolumeUnitFromRows, volumeFromFields } from "@/lib/chart-volume";
import { buildWhatRadarSaw } from "@/lib/replay-explanation";
import { cn } from "@/lib/utils";

type QuickMode = "before_signal" | "signal_detected" | "current_state";

const QUICK_MODES: { id: QuickMode; labelKey: string }[] = [
  { id: "before_signal", labelKey: "replay.beforeSignal" },
  { id: "signal_detected", labelKey: "replay.signalDetected" },
  { id: "current_state", labelKey: "replay.currentState" },
];

function ReplayPageContent() {
  const { t, signalLabel } = useI18n();
  const searchParams = useSearchParams();
  const querySymbol = searchParams.get("symbol")?.toUpperCase() ?? null;
  const querySignalIdRaw = searchParams.get("signal_id");
  const querySignalId =
    querySignalIdRaw != null && querySignalIdRaw !== ""
      ? Number.parseInt(querySignalIdRaw, 10)
      : null;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [symbol, setSymbol] = useState<string | null>(querySymbol);
  const [points, setPoints] = useState<ReplayPoint[]>([]);
  const [quickIndices, setQuickIndices] = useState<ReplayQuickIndices | null>(null);
  const [index, setIndex] = useState(0);
  const [activeMode, setActiveMode] = useState<QuickMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAssets().then(setAssets).catch(() => setAssets([]));
  }, []);

  useEffect(() => {
    if (querySymbol) {
      setSymbol(querySymbol);
      return;
    }
    api
      .getReplayDefaultSymbol()
      .then((data) => setSymbol(data.symbol))
      .catch(() => setSymbol("BTC"));
  }, [querySymbol]);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    const loadReplay = async (target: string, signalId?: number) => {
      const data = await api.getReplay(target, signalId);
      setSymbol(data.symbol);
      setPoints(data.points);
      setQuickIndices(data.quick_indices);
      const focusSignal =
        signalId != null && data.quick_indices?.signal_detected != null
          ? data.quick_indices.signal_detected
          : (data.quick_indices?.current_state ?? Math.max(0, data.points.length - 1));
      setIndex(focusSignal);
      setActiveMode(
        signalId != null && data.quick_indices?.signal_detected != null
          ? "signal_detected"
          : "current_state"
      );
    };

    loadReplay(symbol, querySignalId ?? undefined).catch(async () => {
      try {
        const fallback = await api.getReplayDefaultSymbol();
        await loadReplay(fallback.symbol);
      } catch {
        try {
          await loadReplay("BTC");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load replay");
        }
      }
    }).finally(() => setLoading(false));
  }, [symbol, querySignalId]);

  const currentAsset = useMemo(
    () => assets.find((asset) => asset.symbol === symbol) ?? null,
    [assets, symbol]
  );

  const current = useMemo(() => points[index] ?? null, [points, index]);
  const previous = useMemo(() => (index > 0 ? points[index - 1] : null), [points, index]);

  const whatRadarSaw = useMemo(
    () => (current ? buildWhatRadarSaw(current, previous) : []),
    [current, previous]
  );

  const priceChange = useMemo(() => {
    if (!current || index === 0) return null;
    const prev = points[index - 1];
    const curr = parseFloat(current.price);
    const prevPrice = parseFloat(prev.price);
    if (prevPrice === 0) return null;
    return ((curr - prevPrice) / prevPrice) * 100;
  }, [current, index, points]);

  const volumeMetricLabel = useMemo(() => {
    const unit = chartVolumeUnitFromRows(points);
    return unit === "1m" ? t("asset.chartVolume1m") : t("asset.chartVolume24h");
  }, [points, t]);

  function jumpToMode(mode: QuickMode) {
    if (!quickIndices) return;
    const target = quickIndices[mode];
    if (target == null) return;
    setIndex(target);
    setActiveMode(mode);
  }

  const hasQuickModes =
    quickIndices?.before_signal != null ||
    quickIndices?.signal_detected != null ||
    quickIndices?.current_state != null;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-radar-border pb-6">
          <Link href="/radar" className="text-sm text-radar-muted hover:text-terminal-blue">
            {t("common.backToTerminal")}
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-2xl font-bold tracking-tight text-cmc-text sm:text-3xl">
                {t("replay.title")}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-cmc-muted">{t("replay.subtitle")}</p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {symbol && (
                <AssetIdentity
                  symbol={symbol}
                  name={currentAsset?.name}
                  size="md"
                  layout="stacked"
                />
              )}
              <select
                value={symbol ?? ""}
                onChange={(e) => setSymbol(e.target.value)}
                className="rounded-md border border-radar-border bg-radar-card px-4 py-2.5 font-mono text-sm text-cmc-text shadow-terminal transition-colors hover:border-terminal-blue/30 focus:border-terminal-blue focus:outline-none"
              >
              {(assets.length > 0
                ? assets
                : symbol
                  ? [{ symbol, name: symbol } as Asset]
                  : []
              ).map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} — {asset.name}
                </option>
              ))}
              </select>
            </div>
          </div>
        </header>

        {loading && <p className="text-cmc-muted">{t("replay.loading")}</p>}
        {error && (
          <p className="text-terminal-red">
            {t("common.error")}: {error}
          </p>
        )}

        {!loading && !error && symbol && points.length === 0 && (
          <p className="text-cmc-muted">{t("replay.noData", { symbol })}</p>
        )}

        {!loading && !error && points.length > 0 && current && (
          <>
            <section className="mb-8">
              <h2 className="section-label mb-4">{t("replay.scoreEvolution")}</h2>
              <Card>
                <CardContent className="py-5">
                  <ReplayScoreChart points={points} highlightIndex={index} />
                </CardContent>
              </Card>
            </section>

            {hasQuickModes && (
              <section className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {QUICK_MODES.map((mode) => {
                    const disabled = quickIndices?.[mode.id] == null;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => jumpToMode(mode.id)}
                        className={cn(
                          "rounded border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide transition-colors",
                          disabled
                            ? "cursor-not-allowed border-radar-border/50 text-radar-muted/50"
                            : activeMode === mode.id
                              ? "border-terminal-blue bg-terminal-blue/10 text-terminal-blue"
                              : "border-radar-border text-radar-muted hover:border-terminal-blue/30 hover:text-cmc-text"
                        )}
                      >
                        {t(mode.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <h2 className="section-label mb-4">{t("replay.historicalSnapshot")}</h2>
              <Card>
                <CardContent className="py-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-lg font-semibold text-cmc-text">
                        {formatDate(current.timestamp)}
                      </p>
                      <p className="mt-1 font-mono text-xs text-radar-muted">
                        {t("common.pointOf", { current: index + 1, total: points.length })}
                      </p>
                    </div>
                    <ScoreDisplay score={current.anomaly_score} size="lg" />
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={points.length - 1}
                    value={index}
                    onChange={(e) => {
                      setIndex(Number(e.target.value));
                      setActiveMode(null);
                    }}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-radar-elevated accent-terminal-blue"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-radar-muted">
                    <span>{formatDate(points[0]?.timestamp)}</span>
                    <span>{formatDate(points[points.length - 1]?.timestamp)}</span>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <MetricCard label="Price" value={formatPrice(current.price)} />
                    <MetricCard
                      label={volumeMetricLabel}
                      value={current ? formatVolume(volumeFromFields(current)) : "—"}
                    />
                    <MetricCard
                      label="Price Δ (step)"
                      value={priceChange !== null ? formatPercent(priceChange) : "—"}
                      valueClass={priceChange !== null ? percentColor(priceChange) : undefined}
                    />
                  </div>

                  <div className="mt-8">
                    <h3 className="section-label mb-3">What Radar Saw</h3>
                    <div className="rounded-lg border border-radar-border bg-radar-elevated/40 p-4">
                      <ul className="space-y-2 text-sm text-cmc-text">
                        {whatRadarSaw.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="section-label mb-3">Narrative at this point</h3>
                    <NarrativeBlock narrative={current.narrative} />
                  </div>

                  <div className="mt-8">
                    <h3 className="section-label mb-3">Active Signals</h3>
                    {current.signals.length === 0 ? (
                      <p className="text-sm text-cmc-muted">No signals at this snapshot</p>
                    ) : (
                      <ul className="divide-y divide-radar-border rounded-lg border border-radar-border">
                        {current.signals.map((signal) => (
                          <li
                            key={signal.signal_type}
                            className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-radar-elevated/40"
                          >
                            <span className="font-medium text-cmc-text">
                              {signalLabel(signal.signal_type)}
                            </span>
                            <ScoreBadge score={signal.score} severity={signal.severity} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-radar-border bg-radar-elevated/50 p-4">
      <p className="text-[11px] uppercase tracking-wider text-radar-muted">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold tabular-nums text-cmc-text ${valueClass ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

function ReplayLoadingFallback() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-cmc-muted">{t("replay.loading")}</p>
    </main>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={<ReplayLoadingFallback />}>
      <ReplayPageContent />
    </Suspense>
  );
}
