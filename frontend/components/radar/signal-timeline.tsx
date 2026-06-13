import { formatDate, formatSignalType } from "@/lib/format";
import type { Signal } from "@/lib/api";
import { ScoreBadge } from "./score-badge";

interface SignalTimelineProps {
  signals: Signal[];
}

export function SignalTimeline({ signals }: SignalTimelineProps) {
  if (signals.length === 0) {
    return <p className="text-sm text-cmc-muted">No signal history yet.</p>;
  }

  return (
    <ol className="relative space-y-0 border-l border-radar-border pl-5">
      {signals.map((signal) => (
        <li
          key={`${signal.id}-${signal.signal_type}-${signal.created_at}`}
          className="relative border-b border-radar-border/50 py-4 last:border-0"
        >
          <span className="absolute -left-[22px] top-5 h-2 w-2 rounded-full border border-radar-border bg-radar-card ring-2 ring-radar-bg" />
          <p className="font-mono text-xs tabular-nums text-radar-muted">
            {formatDate(signal.created_at)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-cmc-text">
              {formatSignalType(signal.signal_type)}
            </span>
            <ScoreBadge score={signal.score} severity={signal.severity} />
          </div>
        </li>
      ))}
    </ol>
  );
}
