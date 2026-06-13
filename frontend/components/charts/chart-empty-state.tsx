interface ChartEmptyStateProps {
  message?: string;
  detail?: string;
}

export function ChartEmptyState({
  message = "Not enough data yet.",
  detail = "Radar needs at least 2 snapshots to draw a chart.",
}: ChartEmptyStateProps) {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-radar-border bg-radar-elevated/30 px-6 text-center">
      <p className="font-medium text-cmc-text">{message}</p>
      <p className="mt-2 max-w-sm text-sm text-cmc-muted">{detail}</p>
    </div>
  );
}
