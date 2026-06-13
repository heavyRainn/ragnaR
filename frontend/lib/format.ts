export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1000) {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (num >= 1) return `$${num.toFixed(2)}`;
  return `$${num.toFixed(4)}`;
}

export function formatVolume(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date.toISOString());
}

export function formatSignalType(type: string | null | undefined): string {
  if (!type) return "—";
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function severityFromScore(score: number): string {
  if (score >= 80) return "critical";
  if (score >= 60) return "significant";
  if (score >= 40) return "watch";
  return "normal";
}

export function scoreStyles(score: number): {
  severity: string;
  badge: string;
  bar: string;
  text: string;
} {
  const severity = severityFromScore(score);
  switch (severity) {
    case "critical":
      return {
        severity,
        badge: "bg-terminal-red/10 text-terminal-red border-terminal-red/30",
        bar: "bg-terminal-red",
        text: "text-terminal-red",
      };
    case "significant":
      return {
        severity,
        badge: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30",
        bar: "bg-terminal-amber",
        text: "text-terminal-amber",
      };
    case "watch":
      return {
        severity,
        badge: "bg-terminal-blue/10 text-terminal-blue border-terminal-blue/30",
        bar: "bg-terminal-blue",
        text: "text-terminal-blue",
      };
    default:
      return {
        severity,
        badge: "bg-radar-elevated text-terminal-neutral border-radar-border",
        bar: "bg-terminal-neutral",
        text: "text-terminal-neutral",
      };
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-terminal-red/10 text-terminal-red border-terminal-red/30";
    case "significant":
      return "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30";
    case "watch":
      return "bg-terminal-blue/10 text-terminal-blue border-terminal-blue/30";
    default:
      return "bg-radar-elevated text-terminal-neutral border-radar-border";
  }
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function narrativeTypeLabel(type: string): string {
  return type.replace(/_/g, " ");
}

export function percentColor(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "text-cmc-muted";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num > 0) return "text-cmc-up";
  if (num < 0) return "text-cmc-down";
  return "text-cmc-muted";
}

export function volumeRatioColor(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined) return "text-cmc-muted";
  if (ratio >= 5) return "text-terminal-red";
  if (ratio >= 3) return "text-terminal-amber";
  return "text-cmc-text";
}
