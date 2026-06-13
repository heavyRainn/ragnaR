import type { RadarItem } from "@/lib/api";
import { formatSignalType, narrativeTypeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export function resolveRadarStatus(item: RadarItem): string {
  if (item.anomaly_score === 0) return "Normal";

  const narrativeType = item.narrative?.type;

  if (narrativeType === "VOLATILITY_EVENT") return "Price Shock";
  if (narrativeType === "VOLUME_ANOMALY") return "Volume Anomaly";
  if (narrativeType && narrativeType !== "NORMAL" && narrativeType !== "MIXED_SIGNAL") {
    return narrativeTypeLabel(narrativeType);
  }

  if (item.main_signal) {
    return formatSignalType(item.main_signal);
  }

  return "Normal";
}

interface StatusBadgeProps {
  item: RadarItem;
  className?: string;
}

export function StatusBadge({ item, className }: StatusBadgeProps) {
  const label = resolveRadarStatus(item);
  const isNormal = label === "Normal";

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
