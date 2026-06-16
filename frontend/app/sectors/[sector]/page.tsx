"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/radar/score-badge";
import { api, type SectorDetail } from "@/lib/api";
import { formatPercent, scoreStyles, severityFromScore } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { sectorReplayPath } from "@/lib/sector-path";
import { cn } from "@/lib/utils";

export default function SectorDetailPage() {
  const { t, signalLabel, sectorLabel, translateMarketNarrative } = useI18n();
  const params = useParams();
  const sectorParam = decodeURIComponent(params.sector as string);

  const [detail, setDetail] = useState<SectorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getSector(sectorParam)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [sectorParam]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-radar-muted">{t("sector.loading")}</p>
      </main>
    );
  }

  if (error || !detail) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-terminal-red">{t("sector.notFound")}</p>
        <Link href="/radar" className="text-terminal-blue hover:underline">
          {t("sector.backToRadar")}
        </Link>
      </main>
    );
  }

  const styles = scoreStyles(Math.round(detail.radar_score));

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/radar" className="text-sm text-radar-muted hover:text-terminal-blue">
          {t("sector.backToRadar")}
        </Link>

        <header className="terminal-panel mt-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-mono text-2xl font-bold text-cmc-text sm:text-3xl">
                {t("sector.title", { sector: sectorLabel(detail.sector) })}
              </h1>
              {detail.is_market_leader && (
                <span className="mt-2 inline-block rounded border border-terminal-green/40 bg-terminal-green/10 px-2 py-0.5 font-mono text-xs text-terminal-green">
                  {t("sector.marketLeader")}
                </span>
              )}
            </div>
            <span className={cn("rounded border px-3 py-1 font-mono text-lg font-bold tabular-nums", styles.badge)}>
              {detail.radar_score.toFixed(1)}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric label={t("sector.radarScore")} value={detail.radar_score.toFixed(1)} />
            <Metric label={t("sector.assetsCount")} value={String(detail.assets_count)} />
            <Metric label={t("sector.activeSignals")} value={String(detail.active_signals_count)} />
          </dl>

          <Link
            href={sectorReplayPath(detail.sector)}
            className="mt-6 inline-flex rounded-md border border-terminal-blue/40 bg-terminal-blue/10 px-4 py-2 font-mono text-xs font-semibold text-terminal-blue hover:bg-terminal-blue/20"
          >
            {t("sector.sectorReplay")} →
          </Link>
        </header>

        <section className="mb-8 mt-8">
          <h2 className="section-label mb-4">{t("sector.narrative")}</h2>
          <Card className="border-terminal-blue/20">
            <CardContent className="py-5">
              <p className="text-base leading-relaxed text-cmc-text">
                {translateMarketNarrative(detail.narrative)}
              </p>
              <p className="mt-2 font-mono text-xs text-radar-muted">
                {t("radar.sortChange")}: {formatPercent(detail.average_24h_change)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="section-label mb-4">{t("sector.topAssets")}</h2>
          <Card>
            <CardContent className="divide-y divide-radar-border p-0">
              {detail.top_assets.map((row, index) => (
                <Link
                  key={row.asset.symbol}
                  href={`/assets/${row.asset.symbol}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-radar-elevated/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-xs text-radar-muted">{index + 1}.</span>
                    <AssetIdentity symbol={row.asset.symbol} name={row.asset.name} size="sm" layout="row" />
                  </div>
                  <div className="flex items-center gap-2">
                    {row.main_signal && (
                      <span className="hidden font-mono text-xs text-radar-muted sm:inline">
                        {signalLabel(row.main_signal)}
                      </span>
                    )}
                    <ScoreBadge score={row.anomaly_score} severity={severityFromScore(row.anomaly_score)} />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>

        {detail.active_signals.length > 0 && (
          <section className="mb-8">
            <h2 className="section-label mb-4">{t("sector.activeSignalsList")}</h2>
            <Card>
              <CardContent className="divide-y divide-radar-border p-0">
                {detail.active_signals.map((signal) => (
                  <Link
                    key={signal.id}
                    href={`/assets/${signal.asset_symbol}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-radar-elevated/40"
                  >
                    <div>
                      <p className="font-medium text-cmc-text">{signal.asset_symbol}</p>
                      <p className="text-sm text-cmc-muted">{signalLabel(signal.signal_type)}</p>
                    </div>
                    <ScoreBadge score={signal.score} severity={signal.severity} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-radar-muted">{label}</dt>
      <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-cmc-text">{value}</dd>
    </div>
  );
}
