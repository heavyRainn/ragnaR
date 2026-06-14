"use client";

import type { Signal } from "@/lib/api";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";

interface SignalTimelineProps {
  signals: Signal[];
}

export function SignalTimeline({ signals }: SignalTimelineProps) {
  const { t, signalLabel, formatDate } = useI18n();

  if (signals.length === 0) {
    return <p className="text-sm text-cmc-muted">{t("asset.noSignalHistory")}</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-radar-border pl-5">
      {signals.map((signal) => (
        <li
          key={`${signal.id}-${signal.signal_type}-${signal.created_at}`}
          className="relative border-b border-radar-border/50 py-4 last:border-0"
        >
          <span
            className={cn(
              "absolute -left-[22px] top-5 h-2 w-2 rounded-full border ring-2 ring-radar-bg",
              signal.status === "active"
                ? "border-terminal-blue bg-terminal-blue"
                : "border-radar-muted bg-radar-card"
            )}
          />
          <p className="font-mono text-xs tabular-nums text-radar-muted">
            {formatDate(signal.updated_at ?? signal.created_at)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-cmc-text">
                {signalLabel(signal.signal_type)}
              </span>
              <StatusPill status={signal.status} />
            </div>
            <ScoreBadge score={signal.score} severity={signal.severity} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const isActive = status === "active";
  const label =
    status === "active"
      ? t("status.active")
      : status === "resolved"
        ? t("status.resolved")
        : status;

  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide",
        isActive
          ? "border-terminal-blue/30 bg-terminal-blue/10 text-terminal-blue"
          : "border-radar-border bg-radar-elevated text-radar-muted"
      )}
    >
      {label}
    </span>
  );
}
