"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Signal } from "@/lib/api";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatSignalType, severityFromScore } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";

interface TopActiveSignalsProps {
  signals: Signal[];
}

function isCriticalSignal(signal: Signal): boolean {
  const severity = signal.severity ?? severityFromScore(signal.score);
  return severity === "critical" || signal.score >= 80;
}

export function TopActiveSignals({ signals }: TopActiveSignalsProps) {
  const { t, signalLabel, formatRelativeTime } = useI18n();

  const { critical, topActive } = useMemo(() => {
    const sorted = [...signals].sort((a, b) => b.score - a.score || b.id - a.id);
    const criticalList = sorted.filter(isCriticalSignal);
    const criticalIds = new Set(criticalList.map((s) => s.id));
    const activeList = sorted.filter((s) => !criticalIds.has(s.id)).slice(0, 6);
    return { critical: criticalList, topActive: activeList };
  }, [signals]);

  if (critical.length === 0 && topActive.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="section-label mb-4">{t("radar.topActiveSignals")}</h2>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-cmc-muted">{t("radar.noActiveEvents")}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("radar.topActiveSignals")}</h2>
      <p className="mb-4 text-sm text-cmc-muted">{t("radar.topActiveSignalsHint")}</p>

      <div className="space-y-6">
        {critical.length > 0 && (
          <div>
            <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-terminal-red">
              {t("radar.criticalSignals")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {critical.map((signal) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  variant="critical"
                  signalLabel={signalLabel}
                  formatRelativeTime={formatRelativeTime}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {topActive.length > 0 && (
          <div>
            <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-radar-muted">
              {t("radar.activeSignals")}
            </h3>
            <Card>
              <CardHeader className="pb-0">
                <p className="text-sm text-cmc-muted">{t("radar.topActiveListHint")}</p>
              </CardHeader>
              <CardContent className="divide-y divide-radar-border p-0">
                {topActive.map((signal) => (
                  <SignalRow
                    key={signal.id}
                    signal={signal}
                    signalLabel={signalLabel}
                    formatRelativeTime={formatRelativeTime}
                    t={t}
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

interface SignalRowProps {
  signal: Signal;
  signalLabel: (type: string) => string;
  formatRelativeTime: (iso: string) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function SignalCard({ signal, variant, signalLabel, formatRelativeTime, t }: SignalRowProps & { variant: "critical" }) {
  return (
    <Link href={`/assets/${signal.asset_symbol}`}>
      <Card
        className={cn(
          "group h-full cursor-pointer transition-colors",
          variant === "critical" &&
            "border-terminal-red/40 bg-terminal-red/5 hover:border-terminal-red/60"
        )}
      >
        <CardContent className="flex h-full flex-col gap-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <AssetIdentity
              symbol={signal.asset_symbol ?? "?"}
              name={signal.asset_name ?? undefined}
              size="md"
              layout="stacked"
              symbolClassName="text-terminal-blue"
              nameClassName="group-hover:text-terminal-blue"
            />
            <ScoreBadge score={signal.score} severity={signal.severity} />
          </div>
          <p className="text-sm font-medium text-cmc-text">
            {signalLabel(signal.signal_type) || formatSignalType(signal.signal_type)}
          </p>
          <p className="text-sm text-cmc-muted">
            {signal.feed_description ?? t("radar.anomalyDetected")}
          </p>
          <p className="mt-auto font-mono text-xs text-radar-muted">
            {formatRelativeTime(signal.created_at)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SignalRow({ signal, signalLabel, formatRelativeTime, t }: SignalRowProps) {
  return (
    <Link
      href={`/assets/${signal.asset_symbol}`}
      className="flex gap-4 px-5 py-4 transition-colors hover:bg-radar-elevated/50"
    >
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
        <p className="mt-2 font-mono text-xs text-radar-muted">
          {formatRelativeTime(signal.created_at)}
        </p>
      </div>
      <ScoreBadge score={signal.score} severity={signal.severity} className="shrink-0 self-start" />
    </Link>
  );
}
