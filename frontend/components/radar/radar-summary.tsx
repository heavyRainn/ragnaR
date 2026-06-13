import type { RadarItem } from "@/lib/api";
import { formatSignalType } from "@/lib/format";

interface RadarSummaryProps {
  items: RadarItem[];
}

export function RadarSummary({ items }: RadarSummaryProps) {
  const activeSignals = items.filter((i) => i.anomaly_score > 0).length;
  const avgScore =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.anomaly_score, 0) / items.length)
      : 0;
  const highest = items.reduce<RadarItem | null>(
    (best, item) => (!best || item.anomaly_score > best.anomaly_score ? item : best),
    null
  );

  const stats = [
    { label: "Tracked Assets", value: String(items.length) },
    { label: "Active Signals", value: String(activeSignals) },
    { label: "Avg Anomaly Score", value: String(avgScore) },
    {
      label: "Highest Signal",
      value: highest && highest.anomaly_score > 0
        ? `${highest.asset.symbol} · ${formatSignalType(highest.main_signal)} (${highest.anomaly_score})`
        : "—",
    },
  ];

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-radar-border bg-radar-card px-4 py-3"
        >
          <p className="text-xs uppercase tracking-wider text-cmc-muted">{stat.label}</p>
          <p className="mt-1 truncate font-mono text-lg font-semibold text-cmc-text">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
