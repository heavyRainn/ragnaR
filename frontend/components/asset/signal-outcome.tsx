import type { SignalOutcome } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  formatDate,
  formatPercent,
  formatPrice,
  formatSignalType,
  percentColor,
} from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

interface SignalOutcomeCardProps {
  outcome: SignalOutcome;
}

function outcomeStyles(outcome: SignalOutcome["outcome"]): string {
  switch (outcome) {
    case "Positive":
      return "border-terminal-green/40 bg-terminal-green/5 text-terminal-green";
    case "Negative":
      return "border-terminal-red/40 bg-terminal-red/5 text-terminal-red";
    default:
      return "border-radar-border bg-radar-elevated/40 text-radar-muted";
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function SignalOutcomeCard({ outcome }: SignalOutcomeCardProps) {
  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">Signal Outcome</h2>
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-lg font-semibold text-cmc-text">
                {formatSignalType(outcome.signal_type)}
              </p>
              <p className="mt-1 font-mono text-xs text-radar-muted">
                Score {outcome.signal_score} · {statusLabel(outcome.current_status)}
              </p>
            </div>
            <div
              className={cn(
                "rounded border px-3 py-1.5 font-mono text-sm font-semibold uppercase tracking-wide",
                outcomeStyles(outcome.outcome)
              )}
            >
              Outcome: {outcome.outcome}
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OutcomeItem label="Detected" value={formatDate(outcome.detected_at)} />
            <OutcomeItem label="Price at Signal" value={formatPrice(outcome.price_at_signal)} />
            <OutcomeItem label="Current Price" value={formatPrice(outcome.current_price)} />
            <OutcomeItem
              label="Move after Signal"
              value={formatPercent(outcome.move_after_signal_percent)}
              valueClass={percentColor(outcome.move_after_signal_percent)}
              highlight
            />
          </dl>

          <div className="mt-6 border-t border-radar-border pt-6">
            <p className="text-[11px] uppercase tracking-wider text-radar-muted">Signal Performance</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OutcomeItem
                label="Max Move after Signal"
                value={formatPercent(outcome.max_move_after_signal)}
                valueClass={percentColor(outcome.max_move_after_signal)}
              />
              <OutcomeItem
                label="Worst Move"
                value={formatPercent(outcome.worst_move_after_signal)}
                valueClass={percentColor(outcome.worst_move_after_signal)}
              />
              <OutcomeItem
                label="Best Price"
                value={formatPrice(outcome.best_price_after_signal)}
              />
              <OutcomeItem
                label="Worst Price"
                value={formatPrice(outcome.worst_price_after_signal)}
              />
            </dl>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function OutcomeItem({
  label,
  value,
  valueClass,
  highlight,
}: {
  label: string;
  value: string;
  valueClass?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-radar-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-mono text-sm font-semibold tabular-nums",
          highlight ? "text-base" : "",
          valueClass ?? "text-cmc-text"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
