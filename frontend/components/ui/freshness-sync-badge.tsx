"use client";

import type { SystemStatus } from "@/lib/api";
import { syncAgeSeconds } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useSecondTick } from "@/lib/hooks/use-second-tick";
import { cn } from "@/lib/utils";

interface FreshnessSyncBadgeProps {
  status: SystemStatus | null;
  assetCount: number;
  refreshing?: boolean;
}

type FreshnessLevel = "ok" | "stale" | "error";

function resolveFreshness(status: SystemStatus | null): FreshnessLevel {
  if (!status) return "stale";

  if (status.last_sync_status === "failed" && !status.last_successful_sync_at) {
    return "error";
  }

  const age = syncAgeSeconds(status.last_successful_sync_at);
  const threshold = status.sync_interval_seconds * 2;

  if (status.last_sync_status === "failed" && age !== null && age > threshold) {
    return "error";
  }

  if (age === null) return "stale";
  if (age > threshold) return "stale";
  return "ok";
}

export function FreshnessSyncBadge({ status, assetCount, refreshing }: FreshnessSyncBadgeProps) {
  const { t, formatRelativeTime } = useI18n();
  useSecondTick();

  const level = resolveFreshness(status);
  const isLive = status?.data_source === "live";
  const topN = status?.cmc_listings_limit ?? assetCount;
  const syncedAt = status?.last_successful_sync_at ?? status?.last_market_sync_at ?? null;
  const syncedLabel = syncedAt ? formatRelativeTime(syncedAt) : t("common.never");

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-1 rounded border px-4 py-2 font-mono text-xs",
        level === "ok" && "border-radar-border bg-radar-card",
        level === "stale" && "border-terminal-amber/40 bg-terminal-amber/5",
        level === "error" && "border-terminal-red/40 bg-terminal-red/5"
      )}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              refreshing && "animate-pulse",
              level === "ok" && "bg-cmc-up",
              level === "stale" && "bg-terminal-amber",
              level === "error" && "bg-terminal-red"
            )}
          />
          <span
            className={cn(
              "font-semibold uppercase",
              level === "ok" && "text-cmc-up",
              level === "stale" && "text-terminal-amber",
              level === "error" && "text-terminal-red"
            )}
          >
            {isLive ? t("freshness.live") : t("freshness.mock")}
          </span>
        </span>
        {isLive && (
          <>
            <span className="text-radar-muted">·</span>
            <span className="text-white">{t("common.top", { n: topN })}</span>
          </>
        )}
        <span className="text-radar-muted">·</span>
        <span className="text-radar-muted">{t("common.synced", { time: syncedLabel })}</span>
      </div>

      {level === "stale" && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-terminal-amber">
          {t("freshness.staleWarning")}
        </p>
      )}
      {level === "error" && (
        <p className="max-w-xs text-right text-[10px] font-semibold uppercase tracking-wide text-terminal-red">
          {t("freshness.syncFailed")}
          {status?.last_sync_error ? ` — ${status.last_sync_error}` : ""}
        </p>
      )}
    </div>
  );
}
