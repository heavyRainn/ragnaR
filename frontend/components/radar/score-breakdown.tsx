import type { ScoreBreakdown } from "@/lib/api";
import { scoreStyles } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown;
}

const COMPONENT_LABELS: Record<string, string> = {
  volume: "Volume Shock",
  price: "Price Shock",
  quiet_accumulation: "Quiet Accumulation",
};

export function ScoreBreakdownCard({ breakdown }: ScoreBreakdownCardProps) {
  const entries = Object.entries(breakdown.components).filter(([, value]) => value > 0);
  const totalStyles = scoreStyles(breakdown.total_score);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-cmc-muted">No active score contributors.</p>
    );
  }

  return (
    <div className="space-y-5">
      {entries.map(([key, value]) => {
        const styles = scoreStyles(value);
        return (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-cmc-muted">{COMPONENT_LABELS[key] ?? key}</span>
              <span className={cn(styles.text, "font-mono font-semibold tabular-nums")}>
                {value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-radar-elevated">
              <div
                className={`h-full rounded-full transition-all ${styles.bar}`}
                style={{ width: `${Math.min(100, value)}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="border-t border-radar-border pt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-medium text-cmc-text">Total Score</span>
          <span className={`font-mono text-2xl font-bold tabular-nums ${totalStyles.text}`}>
            {breakdown.total_score}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-radar-elevated">
          <div
            className={`h-full rounded-full ${totalStyles.bar}`}
            style={{ width: `${Math.min(100, breakdown.total_score)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
