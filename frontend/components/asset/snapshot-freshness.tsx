"use client";

import type { SystemStatus } from "@/lib/api";
import { syncAgeSeconds } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useSecondTick } from "@/lib/hooks/use-second-tick";
import { cn } from "@/lib/utils";

interface SnapshotFreshnessProps {
  capturedAt: string | null | undefined;
  systemStatus: SystemStatus | null;
}

export function SnapshotFreshness({ capturedAt, systemStatus }: SnapshotFreshnessProps) {
  useSecondTick();
  const { t, formatRelativeTime } = useI18n();

  const age = syncAgeSeconds(capturedAt);
  const threshold = (systemStatus?.sync_interval_seconds ?? 60) * 2;
  const isStale = age !== null && age > threshold;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-radar-border pt-4">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-radar-muted">{t("asset.latestSnapshot")}</p>
        <p className={cn("mt-1 font-mono text-sm font-semibold", isStale ? "text-terminal-amber" : "text-cmc-text")}>
          {capturedAt ? formatRelativeTime(capturedAt) : "—"}
        </p>
      </div>
      {isStale && (
        <span className="rounded border border-terminal-amber/40 bg-terminal-amber/10 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-terminal-amber">
          {t("asset.dataStale")}
        </span>
      )}
    </div>
  );
}
