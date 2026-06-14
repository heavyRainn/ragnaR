"use client";

import type { MarketRotation, SectorRotation } from "@/lib/api";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatPercent, scoreStyles } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface CapitalRotationProps {
  data: MarketRotation;
}

const DISPLAY_SECTORS = new Set([
  "AI",
  "DeFi",
  "Layer1",
  "Meme",
  "Gaming",
  "Infrastructure",
  "RWA",
]);

function topSectors(sectors: SectorRotation[]): SectorRotation[] {
  return sectors
    .filter((s) => DISPLAY_SECTORS.has(s.sector))
    .slice(0, 3);
}

function barSectors(sectors: SectorRotation[]): SectorRotation[] {
  return sectors.filter((s) => DISPLAY_SECTORS.has(s.sector));
}

export function CapitalRotation({ data }: CapitalRotationProps) {
  const { t } = useI18n();
  const top = topSectors(data.sectors);
  const bars = barSectors(data.sectors);
  const maxScore = Math.max(...bars.map((s) => s.average_radar_score), 1);

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("capitalRotation.title")}</h2>

      <Card className="mb-4 border-terminal-blue/20 bg-terminal-blue/[0.03]">
        <CardContent className="py-5">
          <p className="text-[11px] uppercase tracking-wider text-radar-muted">
            {t("capitalRotation.marketNarrative")}
          </p>
          <p className="mt-2 font-mono text-base font-semibold leading-relaxed text-cmc-text sm:text-lg">
            {data.market_narrative}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs text-radar-muted">
            {data.leader_sector && (
              <span className="rounded border border-terminal-green/30 bg-terminal-green/5 px-2 py-1 text-terminal-green">
                {t("capitalRotation.leader", { sector: data.leader_sector })}
              </span>
            )}
            {data.lagging_sector && data.lagging_sector !== data.leader_sector && (
              <span className="rounded border border-radar-border px-2 py-1">
                {t("capitalRotation.lagging", { sector: data.lagging_sector })}
              </span>
            )}
            {data.most_active_sector && (
              <span className="rounded border border-terminal-amber/30 bg-terminal-amber/5 px-2 py-1 text-terminal-amber">
                {t("capitalRotation.mostActive", { sector: data.most_active_sector })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-radar-muted">
            {t("capitalRotation.topSectors")}
          </h3>
          <div className="space-y-3">
            {top.map((sector) => (
              <SectorCard key={sector.sector} sector={sector} highlight />
            ))}
            {top.length === 0 && (
              <p className="text-sm text-cmc-muted">{t("capitalRotation.noSectorData")}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-radar-muted">
            {t("capitalRotation.sectorRadarScore")}
          </h3>
          <Card>
            <CardContent className="space-y-4 py-5">
              {bars.map((sector) => {
                const widthPct = Math.max(4, (sector.average_radar_score / maxScore) * 100);
                const styles = scoreStyles(Math.round(sector.average_radar_score));
                return (
                  <div key={sector.sector}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-xs">
                      <span className="font-semibold text-cmc-text">{sector.sector}</span>
                      <span className={cn("tabular-nums", styles.text)}>
                        {sector.average_radar_score.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-radar-elevated">
                      <div
                        className={cn("h-full rounded-full transition-all", styles.bar)}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex gap-4 font-mono text-[10px] text-radar-muted">
                      <span>{t("capitalRotation.signalCount", { count: sector.active_signals_count })}</span>
                      <span>{t("capitalRotation.avgChange", { value: formatPercent(sector.average_24h_change) })}</span>
                      <span>{t("capitalRotation.assetCount", { count: sector.assets_count })}</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function SectorCard({
  sector,
  highlight,
}: {
  sector: SectorRotation;
  highlight?: boolean;
}) {
  const { t } = useI18n();
  const styles = scoreStyles(Math.round(sector.average_radar_score));

  return (
    <Card className={highlight ? "border-radar-border" : undefined}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-sm font-semibold text-cmc-text">{sector.sector}</p>
          <span
            className={cn(
              "rounded border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
              styles.badge
            )}
          >
            {sector.average_radar_score.toFixed(1)}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
          <div>
            <dt className="text-radar-muted">{t("capitalRotation.avgScore")}</dt>
            <dd className={cn("mt-0.5 font-semibold tabular-nums", styles.text)}>
              {sector.average_radar_score.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-radar-muted">{t("capitalRotation.signalsLabel")}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-cmc-text">
              {sector.active_signals_count}
            </dd>
          </div>
          <div>
            <dt className="text-radar-muted">{t("radar.sortChange")}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-cmc-text">
              {formatPercent(sector.average_24h_change)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
