"use client";

import Link from "next/link";
import type { HistoricalSignal } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatPercent, severityFromScore } from "@/lib/format";
import { ScoreBadge } from "@/components/radar/score-badge";
import { cn } from "@/lib/utils";

interface SignalHistoryProps {
  signals: HistoricalSignal[];
  symbol: string;
}

function formatDuration(seconds: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  if (seconds < 60) return t("asset.durationSeconds", { count: seconds });
  if (seconds < 3600) return t("asset.durationMinutes", { count: Math.round(seconds / 60) });
  return t("asset.durationHours", { count: Math.round(seconds / 3600) });
}

export function SignalHistory({ signals, symbol }: SignalHistoryProps) {
  const { t, signalLabel, formatDate } = useI18n();

  if (signals.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("asset.signalHistory")}</h2>
      <div className="space-y-4">
        {signals.map((signal) => {
          const isActive = signal.status === "active";
          return (
            <Card
              key={signal.id}
              className={cn(
                "border",
                isActive ? "border-terminal-blue/30 bg-terminal-blue/5" : "border-radar-border"
              )}
            >
              <CardContent className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-cmc-text">
                      {signalLabel(signal.signal_type)}
                    </h3>
                    <ScoreBadge
                      score={signal.peak_score}
                      severity={severityFromScore(signal.peak_score)}
                    />
                  </div>
                  <Link
                    href={`/replay?symbol=${symbol}&signal_id=${signal.id}`}
                    className="rounded-md border border-terminal-blue/40 bg-terminal-blue/10 px-3 py-1.5 font-mono text-xs font-semibold text-terminal-blue transition hover:bg-terminal-blue/20"
                  >
                    {t("asset.openReplay")}
                  </Link>
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <HistoryField label={t("asset.detected")} value={formatDate(signal.detected_at)} />
                  <HistoryField
                    label={t("asset.resolved")}
                    value={signal.resolved_at ? formatDate(signal.resolved_at) : "—"}
                  />
                  <HistoryField label={t("asset.peakScoreLabel")} value={String(signal.peak_score)} />
                  <HistoryField
                    label={t("asset.outcome")}
                    value={
                      signal.outcome_percent != null ? formatPercent(signal.outcome_percent) : "—"
                    }
                    valueClass={
                      signal.outcome_percent != null
                        ? signal.outcome_percent >= 0
                          ? "text-terminal-green"
                          : "text-terminal-red"
                        : undefined
                    }
                  />
                  <HistoryField
                    label={t("asset.duration")}
                    value={formatDuration(signal.duration_seconds, t)}
                  />
                  <HistoryField
                    label={t("asset.statusLabel")}
                    value={
                      isActive ? t("asset.statusActive") : t("asset.statusResolved")
                    }
                    valueClass={isActive ? "text-terminal-blue" : "text-radar-muted"}
                  />
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function HistoryField({
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
      <dt className="text-[11px] uppercase tracking-wider text-radar-muted">{label}</dt>
      <dd className={cn("mt-1 font-mono text-sm font-semibold text-cmc-text", valueClass)}>{value}</dd>
    </div>
  );
}
