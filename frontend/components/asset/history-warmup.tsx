import { cn } from "@/lib/utils";

interface HistoryWarmupProps {
  snapshotCount: number;
  requiredSnapshotCount: number;
  isLiveMode?: boolean;
}

export function HistoryWarmup({
  snapshotCount,
  requiredSnapshotCount,
  isLiveMode = false,
}: HistoryWarmupProps) {
  const isWarmingUp = snapshotCount < requiredSnapshotCount;
  const progress = Math.min(100, Math.round((snapshotCount / requiredSnapshotCount) * 100));

  if (!isWarmingUp && !isLiveMode) return null;

  return (
    <section
      className={cn(
        "terminal-panel mb-8 border p-5",
        isWarmingUp
          ? "border-terminal-amber/30 bg-terminal-amber/5"
          : "border-radar-border bg-radar-elevated/20"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="section-label mb-2">History Warm-up</h2>
          <p className="text-sm font-medium text-cmc-text">
            {isWarmingUp
              ? "Collecting market history for this asset."
              : "Historical baseline is ready."}
          </p>
        </div>
        {isWarmingUp && (
          <span className="rounded border border-terminal-amber/40 bg-terminal-amber/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-terminal-amber">
            Warming up
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-cmc-muted">Snapshots collected</span>
          <span className="font-mono font-semibold tabular-nums text-cmc-text">
            {snapshotCount} / {requiredSnapshotCount}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-radar-elevated">
          <div
            className="h-full rounded-full bg-terminal-amber transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isWarmingUp && (
        <p className="mt-4 text-sm leading-relaxed text-cmc-muted">
          Signals become reliable after enough historical data is collected. Charts and Radar
          Score will improve as new snapshots are added.
        </p>
      )}

      {isLiveMode && isWarmingUp && (
        <p className="mt-3 text-sm leading-relaxed text-terminal-blue/90">
          Live data collection started recently. Historical charts will become more useful as
          new snapshots are collected every sync cycle — no artificial backfill is applied.
        </p>
      )}
    </section>
  );
}
