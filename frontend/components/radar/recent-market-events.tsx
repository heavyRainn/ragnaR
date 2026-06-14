import Link from "next/link";
import type { RecentMarketEvent } from "@/lib/api";
import { formatPercent, formatRelativeTime, formatSignalType, percentColor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface RecentMarketEventsProps {
  events: RecentMarketEvent[];
}

export function RecentMarketEvents({ events }: RecentMarketEventsProps) {
  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">Recent Market Events</h2>
      <Card>
        <CardHeader>
          <p className="text-sm text-cmc-muted">
            Latest detected signals — active and resolved — with post-signal price moves
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-radar-border p-0">
          {events.length === 0 ? (
            <p className="px-5 py-8 text-sm text-cmc-muted">No signal history yet.</p>
          ) : (
            events.map((event) => (
              <Link
                key={`${event.asset_symbol}-${event.signal_type}-${event.detected_at}`}
                href={`/assets/${event.asset_symbol}`}
                className="flex flex-wrap items-start gap-4 px-5 py-4 transition-colors hover:bg-radar-elevated/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-terminal-blue">
                      {event.asset_symbol}
                    </span>
                    <span className="text-sm font-medium text-cmc-text">
                      {formatSignalType(event.signal_type)}
                    </span>
                    <StatusPill status={event.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-radar-muted">
                    <span>Peak Score: {event.peak_score}</span>
                    {event.move_after_signal_percent != null && (
                      <span className={percentColor(event.move_after_signal_percent)}>
                        Move After Signal: {formatPercent(event.move_after_signal_percent)}
                      </span>
                    )}
                    <span>{formatRelativeTime(event.detected_at)}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      className={cn(
        "rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
        isActive
          ? "border-terminal-amber/40 bg-terminal-amber/10 text-terminal-amber"
          : "border-radar-border bg-radar-elevated text-radar-muted"
      )}
    >
      {status}
    </span>
  );
}
