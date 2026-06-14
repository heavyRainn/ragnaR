"use client";

import Link from "next/link";
import type { RecentMarketEvent } from "@/lib/api";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { formatPercent, formatRelativeTime, formatSignalType } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RecentMarketEventsProps {
  events: RecentMarketEvent[];
}

export function RecentMarketEvents({ events }: RecentMarketEventsProps) {
  const { t, signalLabel, formatRelativeTime: fmtRelative } = useI18n();

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("radar.recentEvents")}</h2>
      <Card>
        <CardHeader>
          <p className="text-sm text-cmc-muted">{t("radar.recentEventsHint")}</p>
        </CardHeader>
        <CardContent className="divide-y divide-radar-border p-0">
          {events.length === 0 ? (
            <p className="px-5 py-8 text-sm text-cmc-muted">{t("radar.noEventHistory")}</p>
          ) : (
            events.map((event) => (
              <Link
                key={`${event.asset_symbol}-${event.signal_type}-${event.detected_at}`}
                href={`/assets/${event.asset_symbol}`}
                className="flex flex-wrap items-start gap-4 px-5 py-4 transition-colors hover:bg-radar-elevated/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AssetIdentity
                      symbol={event.asset_symbol}
                      size="sm"
                      layout="symbol"
                      symbolClassName="text-terminal-blue"
                    />
                    <span className="text-sm font-medium text-cmc-text">
                      {signalLabel(event.signal_type) || formatSignalType(event.signal_type)}
                    </span>
                    <StatusPill status={event.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-radar-muted">
                    <span>{t("common.peakScore", { score: event.peak_score })}</span>
                    {event.move_after_signal_percent != null && (
                      <span className={event.move_after_signal_percent >= 0 ? "text-cmc-up" : "text-cmc-down"}>
                        {t("common.moveAfterSignal", {
                          value: formatPercent(event.move_after_signal_percent),
                        })}
                      </span>
                    )}
                    <span>{fmtRelative(event.detected_at)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const isActive = status === "active";
  const label = isActive ? t("status.active") : t("status.resolved");

  return (
    <span
      className={cn(
        "rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
        isActive
          ? "border-terminal-amber/40 bg-terminal-amber/10 text-terminal-amber"
          : "border-radar-border bg-radar-elevated text-radar-muted"
      )}
    >
      {label}
    </span>
  );
}
