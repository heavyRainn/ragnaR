"use client";

import type { RadarItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

function resolveRadarStatus(
  item: RadarItem,
  signalLabel: (type: string | null | undefined) => string,
  narrativeLabel: (type: string | null | undefined) => string,
  normalLabel: string
): string {
  if (item.anomaly_score === 0) return normalLabel;

  const narrativeType = item.narrative?.type;

  if (narrativeType === "VOLATILITY_EVENT") return signalLabel("price_shock");
  if (narrativeType === "VOLUME_ANOMALY") return narrativeLabel("VOLUME_ANOMALY");
  if (narrativeType && narrativeType !== "NORMAL" && narrativeType !== "MIXED_SIGNAL") {
    return narrativeLabel(narrativeType);
  }

  if (item.main_signal) {
    return signalLabel(item.main_signal);
  }

  return normalLabel;
}

interface StatusBadgeProps {
  item: RadarItem;
  className?: string;
}

export function StatusBadge({ item, className }: StatusBadgeProps) {
  const { signalLabel, narrativeLabel, t } = useI18n();
  const normalLabel = t("severity.normal");
  const label = resolveRadarStatus(item, signalLabel, narrativeLabel, normalLabel);
  const isNormal = item.anomaly_score === 0;

  return (
    <span
      className={cn(
        "inline-flex max-w-[140px] items-center rounded border px-2 py-0.5 text-[11px] font-medium leading-tight",
        isNormal
          ? "border-radar-border bg-radar-elevated/50 text-radar-muted"
          : "border-terminal-blue/25 bg-terminal-blue/10 text-terminal-blue",
        !isNormal && item.severity === "critical" && "border-terminal-red/30 bg-terminal-red/10 text-terminal-red",
        !isNormal &&
          item.severity === "significant" &&
          "border-terminal-amber/30 bg-terminal-amber/10 text-terminal-amber",
        className
      )}
    >
      {label}
    </span>
  );
}
