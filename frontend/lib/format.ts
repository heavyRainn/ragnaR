export const REQUIRED_SNAPSHOT_COUNT = 21;

export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(num)) return "—";

  if (num >= 1000) {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (num >= 1) {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (num >= 0.01) {
    return `$${num.toFixed(4)}`;
  }
  if (num >= 0.0001) {
    return `$${num.toFixed(6)}`;
  }

  const trimmed = num.toFixed(10).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  if (trimmed === "0" || parseFloat(trimmed) === 0) {
    return `$${num.toExponential(4)}`;
  }
  return `$${trimmed}`;
}

export function priceChartDomain(prices: number[]): [number, number] {
  if (prices.length === 0) return [0, 1];

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.01, min * 0.01 || 1e-12);
    return [min - padding, max + padding];
  }

  return [min * 0.995, max * 1.005];
}

export function priceAxisWidth(prices: number[]): number {
  if (prices.length === 0) return 88;
  const sample = formatPrice(Math.min(...prices));
  return Math.min(130, Math.max(88, sample.length * 7 + 12));
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
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function percentColorStrong(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "text-radar-muted";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num > 0) return "text-terminal-green";
  if (num < 0) return "text-terminal-red";
  return "text-radar-muted";
}

export function rowHighlightClass(score: number): string {
  if (score <= 0) return "";
  const severity = severityFromScore(score);
  switch (severity) {
    case "critical":
      return "border-l-2 border-l-terminal-red bg-terminal-red/[0.04] hover:bg-terminal-red/[0.07]";
    case "significant":
      return "border-l-2 border-l-terminal-amber bg-terminal-amber/[0.04] hover:bg-terminal-amber/[0.07]";
    case "watch":
      return "border-l-2 border-l-terminal-blue bg-terminal-blue/[0.04] hover:bg-terminal-blue/[0.07]";
    default:
      return "border-l-2 border-l-terminal-neutral bg-radar-elevated/30 hover:bg-radar-elevated/50";
  }
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
