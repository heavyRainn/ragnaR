"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { api, type SectorReplay } from "@/lib/api";
import { formatDate, scoreStyles } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { sectorPath } from "@/lib/sector-path";
import { cn } from "@/lib/utils";

export default function SectorReplayPage() {
  const { t, sectorLabel, translateMarketNarrative } = useI18n();
  const params = useParams();
  const sectorParam = decodeURIComponent(params.sector as string);

  const [replay, setReplay] = useState<SectorReplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getSectorReplay(sectorParam)
      .then(setReplay)
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, [sectorParam]);

  const maxScore = useMemo(
    () => Math.max(...(replay?.points.map((p) => p.sector_score) ?? [1]), 1),
    [replay]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-radar-muted">{t("sectorReplay.loading")}</p>
      </main>
    );
  }

  if (error || !replay) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-terminal-red">{t("sectorReplay.noData", { sector: sectorLabel(sectorParam) })}</p>
        <Link href="/radar" className="text-terminal-blue hover:underline">
          {t("sector.backToRadar")}
        </Link>
      </main>
    );
  }

  const endStyles = scoreStyles(Math.round(replay.score_end ?? 0));

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href={sectorPath(replay.sector)} className="text-sm text-radar-muted hover:text-terminal-blue">
          {t("sectorReplay.backToSector")}
        </Link>

        <header className="mt-6 mb-8 border-b border-radar-border pb-6">
          <h1 className="font-mono text-2xl font-bold text-cmc-text sm:text-3xl">
            {t("sectorReplay.title")} — {sectorLabel(replay.sector)}
          </h1>
          <p className="mt-2 text-sm text-cmc-muted">{t("sectorReplay.subtitle")}</p>
        </header>

        <Card className="mb-8 border-terminal-blue/20">
          <CardContent className="py-5">
            <p className="text-base leading-relaxed text-cmc-text">
              {translateMarketNarrative(replay.narrative)}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3 font-mono text-xs">
              {replay.score_change != null && (
                <div>
                  <dt className="text-radar-muted">{t("sectorReplay.scoreChange")}</dt>
                  <dd
                    className={cn(
                      "mt-1 font-semibold tabular-nums",
                      replay.score_change >= 0 ? "text-terminal-green" : "text-terminal-red"
                    )}
                  >
                    {replay.score_change >= 0 ? "+" : ""}
                    {replay.score_change}
                  </dd>
                </div>
              )}
              {replay.leader_sector_start && (
                <div>
                  <dt className="text-radar-muted">{t("sectorReplay.leaderStart")}</dt>
                  <dd className="mt-1 font-semibold text-cmc-text">
                    {sectorLabel(replay.leader_sector_start)}
                  </dd>
                </div>
              )}
              {replay.leader_sector_end && (
                <div>
                  <dt className="text-radar-muted">{t("sectorReplay.leaderEnd")}</dt>
                  <dd className={cn("mt-1 font-semibold", endStyles.text)}>
                    {sectorLabel(replay.leader_sector_end)}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <section>
          <h2 className="section-label mb-4">{t("sectorReplay.scoreTimeline")}</h2>
          {replay.points.length === 0 ? (
            <p className="text-cmc-muted">{t("sectorReplay.noData", { sector: replay.sector })}</p>
          ) : (
            <Card>
              <CardContent className="space-y-3 py-5">
                {replay.points.map((point) => {
                  const widthPct = Math.max(6, (point.sector_score / maxScore) * 100);
                  const styles = scoreStyles(Math.round(point.sector_score));
                  return (
                    <div key={point.timestamp} className="flex flex-wrap items-center gap-3">
                      <span className="w-28 shrink-0 font-mono text-xs tabular-nums text-radar-muted">
                        {formatDate(point.timestamp)}
                      </span>
                      <div className="min-w-[120px] flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-radar-elevated">
                          <div
                            className={cn("h-full rounded-full transition-all", styles.bar)}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                      <span className={cn("w-10 font-mono text-sm font-semibold tabular-nums", styles.text)}>
                        {point.sector_score}
                      </span>
                      {point.active_signals_count > 0 && (
                        <span className="font-mono text-[10px] text-terminal-amber">
                          {t("sectorReplay.signalsAtPoint", { count: point.active_signals_count })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
