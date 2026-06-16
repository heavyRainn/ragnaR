"use client";

import Link from "next/link";
import type { MarketRotation, SectorRotation } from "@/lib/api";
import {
  displaySectors,
  resolveCapitalRotationStory,
  trendLabel,
} from "@/lib/capital-rotation-story";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatPercent, percentColorStrong } from "@/lib/format";
import { sectorPath } from "@/lib/sector-path";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface CapitalRotationProps {
  data: MarketRotation;
}

export function CapitalRotation({ data }: CapitalRotationProps) {
  const { t, sectorLabel } = useI18n();
  const sectors = displaySectors(data.sectors);
  const story = resolveCapitalRotationStory(data, t, sectorLabel);

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="section-label">{t("capitalRotation.title")}</h2>
        <p className="mt-1 text-sm text-cmc-muted">{t("capitalRotation.subtitle")}</p>
      </div>

      <Card className="mb-4 border-terminal-blue/20 bg-terminal-blue/[0.03]">
        <CardContent className="py-5">
          <p className="text-[11px] uppercase tracking-wider text-radar-muted">
            {t("capitalRotation.marketStory")}
          </p>
          <p className="mt-2 font-mono text-base font-semibold leading-relaxed text-cmc-text sm:text-lg">
            {story}
          </p>
        </CardContent>
      </Card>

      {sectors.length === 0 ? (
        <p className="text-sm text-cmc-muted">{t("capitalRotation.noSectorData")}</p>
      ) : (
        <Card>
          <CardContent className="divide-y divide-radar-border p-0">
            {sectors.map((sector) => (
              <SectorRow key={sector.sector} sector={sector} />
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function SectorRow({ sector }: { sector: SectorRotation }) {
  const { t, sectorLabel } = useI18n();
  const trend = trendLabel(sector.trend, t);

  return (
    <Link
      href={sectorPath(sector.sector)}
      className="block px-4 py-4 transition-colors hover:bg-radar-elevated/40 sm:px-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-cmc-text sm:text-base">
            {sectorLabel(sector.sector)}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs sm:text-sm">
            <span className={cn("tabular-nums", percentColorStrong(sector.average_24h_change))}>
              {formatPercent(sector.average_24h_change)}{" "}
              <span className="text-radar-muted">({t("capitalRotation.change24h")})</span>
            </span>
            <span className={cn("tabular-nums", percentColorStrong(sector.average_1h_change))}>
              {formatPercent(sector.average_1h_change)}{" "}
              <span className="text-radar-muted">({t("capitalRotation.change1h")})</span>
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-radar-muted sm:text-xs">
            {t("capitalRotation.assetCount", { count: sector.assets_count })}
            <span className="mx-2 text-radar-border">·</span>
            {t("capitalRotation.signalCount", { count: sector.active_signals_count })}
          </p>
        </div>
        <div className={cn("shrink-0 text-right font-mono text-xs sm:text-sm", trend.className)}>
          <span className="text-base font-semibold sm:text-lg">{trend.icon}</span>{" "}
          <span className="font-medium">{trend.label}</span>
        </div>
      </div>
    </Link>
  );
}
