"use client";

import Link from "next/link";
import type { Signal } from "@/lib/api";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatSignalType, formatTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { ScoreBadge } from "./score-badge";

interface IntelligenceFeedProps {
  signals: Signal[];
}

export function IntelligenceFeed({ signals }: IntelligenceFeedProps) {
  const { t, signalLabel } = useI18n();
  const feed = signals.slice(0, 12);

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("radar.intelligenceFeed")}</h2>
      <Card>
        <CardHeader>
          <p className="text-sm text-cmc-muted">{t("radar.intelligenceFeedHint")}</p>
        </CardHeader>
        <CardContent className="divide-y divide-radar-border p-0">
          {feed.length === 0 ? (
            <p className="px-5 py-8 text-sm text-cmc-muted">{t("radar.noActiveEvents")}</p>
          ) : (
            feed.map((signal) => (
              <Link
                key={`${signal.id}-${signal.signal_type}`}
                href={`/assets/${signal.asset_symbol}`}
                className="flex gap-4 px-5 py-4 transition-colors hover:bg-radar-elevated/50"
              >
                <span className="w-12 shrink-0 font-mono text-sm tabular-nums text-radar-muted">
                  {formatTime(signal.created_at)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AssetIdentity
                      symbol={signal.asset_symbol ?? "?"}
                      size="sm"
                      layout="symbol"
                      symbolClassName="text-terminal-blue"
                    />
                    <span className="text-sm font-medium text-cmc-text">
                      {signalLabel(signal.signal_type) || formatSignalType(signal.signal_type)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-cmc-muted">
                    {signal.feed_description ?? t("radar.anomalyDetected")}
                  </p>
                </div>
                <ScoreBadge score={signal.score} severity={signal.severity} className="shrink-0" />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
