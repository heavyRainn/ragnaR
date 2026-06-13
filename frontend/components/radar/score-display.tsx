import { scoreStyles } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "text-lg px-2 py-0.5",
  md: "text-2xl px-3 py-1",
  lg: "text-4xl px-4 py-2",
  xl: "text-5xl px-5 py-2",
};

export function ScoreDisplay({ score, size = "md", className }: ScoreDisplayProps) {
  const styles = scoreStyles(score);
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-mono font-bold tabular-nums",
        styles.badge,
        sizeClasses[size],
        className
      )}
    >
      {score}
    </div>
  );
}
