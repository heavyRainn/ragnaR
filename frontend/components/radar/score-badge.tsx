import { severityColor, severityFromScore } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  severity?: string;
  className?: string;
}

export function ScoreBadge({ score, severity, className }: ScoreBadgeProps) {
  const sev = severity ?? severityFromScore(score);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
        severityColor(sev),
        className
      )}
    >
      {score}
    </span>
  );
}
