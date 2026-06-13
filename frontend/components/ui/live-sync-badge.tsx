"use client";

import { formatRelativeTime } from "@/lib/format";
import { useMinuteTick } from "@/lib/hooks/use-minute-tick";

interface LiveSyncBadgeProps {
  assetCount: number;
  lastSyncedAt: Date | null;
  refreshing?: boolean;
}

export function LiveSyncBadge({ assetCount, lastSyncedAt, refreshing }: LiveSyncBadgeProps) {
  useMinuteTick();

  return (
    <div className="flex items-center gap-3 rounded border border-radar-border bg-radar-card px-4 py-2 font-mono text-xs">
      <span className="flex items-center gap-1.5">
        <span
          className={`inline-block h-2 w-2 rounded-full ${refreshing ? "animate-pulse bg-cmc-up" : "bg-cmc-up"}`}
        />
        <span className="font-semibold text-cmc-up">LIVE</span>
      </span>
      <span className="text-radar-muted">·</span>
      <span className="text-white">{assetCount} assets</span>
      {lastSyncedAt && (
        <>
          <span className="text-radar-muted">·</span>
          <span className="text-radar-muted">
            Synced {formatRelativeTime(lastSyncedAt.toISOString())}
          </span>
        </>
      )}
    </div>
  );
}
