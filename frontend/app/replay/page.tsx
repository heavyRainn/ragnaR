"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReplayScoreChart } from "@/components/charts/replay-score-chart";
import { NarrativeBlock } from "@/components/radar/narrative-block";
import { ScoreDisplay } from "@/components/radar/score-display";
import { ScoreBadge } from "@/components/radar/score-badge";
import { Card, CardContent } from "@/components/ui/card";
import { api, type Asset, type ReplayPoint } from "@/lib/api";
import {
  formatDate,
  formatPercent,
  formatPrice,
  formatSignalType,
  formatVolume,
  percentColor,
} from "@/lib/format";

function ReplayPageContent() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol")?.toUpperCase() ?? "BTC";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [points, setPoints] = useState<ReplayPoint[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAssets().then(setAssets).catch(() => setAssets([]));
  }, []);

  useEffect(() => {
    setSymbol(initialSymbol);
  }, [initialSymbol]);

  useEffect(() => {
    setLoading(true);
    api
      .getReplay(symbol)
      .then((data) => {
        setPoints(data.points);
        setIndex(Math.max(0, data.points.length - 1));
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [symbol]);

  const current = useMemo(() => points[index] ?? null, [points, index]);

  const priceChange = useMemo(() => {
    if (!current || index === 0) return null;
    const prev = points[index - 1];
    const curr = parseFloat(current.price);
    const prevPrice = parseFloat(prev.price);
    if (prevPrice === 0) return null;
    return ((curr - prevPrice) / prevPrice) * 100;
  }, [current, index, points]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-radar-border pb-6">
          <Link href="/radar" className="text-sm text-radar-muted hover:text-terminal-blue">
            ← Market Terminal
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-2xl font-bold tracking-tight text-cmc-text sm:text-3xl">
                Signal Replay
              </h1>
              <p className="mt-2 max-w-lg text-sm text-cmc-muted">
                Scrub through historical snapshots to see when the system detected anomalies
                before price movement.
              </p>
            </div>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="rounded-md border border-radar-border bg-radar-card px-4 py-2.5 font-mono text-sm text-cmc-text shadow-terminal transition-colors hover:border-terminal-blue/30 focus:border-terminal-blue focus:outline-none"
            >
              {(assets.length > 0 ? assets : [{ symbol, name: symbol } as Asset]).map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} — {asset.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {loading && <p className="text-cmc-muted">Loading replay data...</p>}
        {error && <p className="text-terminal-red">Error: {error}</p>}

        {!loading && !error && points.length === 0 && (
          <p className="text-cmc-muted">No replay data available for {symbol}.</p>
        )}

        {!loading && !error && points.length > 0 && current && (
          <>
            <section className="mb-8">
              <h2 className="section-label mb-4">Score Evolution</h2>
              <Card>
                <CardContent className="py-5">
                  <ReplayScoreChart points={points} highlightIndex={index} />
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="section-label mb-4">Historical Snapshot</h2>
              <Card>
                <CardContent className="py-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-lg font-semibold text-cmc-text">
                        {formatDate(current.timestamp)}
                      </p>
                      <p className="mt-1 font-mono text-xs text-radar-muted">
                        Point {index + 1} of {points.length}
                      </p>
                    </div>
                    <ScoreDisplay score={current.anomaly_score} size="lg" />
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={points.length - 1}
                    value={index}
                    onChange={(e) => setIndex(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-radar-elevated accent-terminal-blue"
                  />
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-radar-muted">
                    <span>{formatDate(points[0]?.timestamp)}</span>
                    <span>{formatDate(points[points.length - 1]?.timestamp)}</span>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <MetricCard label="Price" value={formatPrice(current.price)} />
                    <MetricCard label="Volume 24h" value={formatVolume(current.volume_24h)} />
                    <MetricCard
                      label="Price Δ (step)"
                      value={priceChange !== null ? formatPercent(priceChange) : "—"}
                      valueClass={priceChange !== null ? percentColor(priceChange) : undefined}
                    />
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
                              {formatSignalType(signal.signal_type)}
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

export default function ReplayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-cmc-muted">Loading replay...</p>
        </main>
      }
    >
      <ReplayPageContent />
    </Suspense>
  );
}
