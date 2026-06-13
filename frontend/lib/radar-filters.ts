import type { RadarItem } from "@/lib/api";
import { severityFromScore } from "@/lib/format";

export type SignalFilter =
  | "all"
  | "volume_shock"
  | "price_shock"
  | "quiet_accumulation"
  | "none";

export type SeverityFilter = "all" | "normal" | "watch" | "significant" | "critical";

export type SortField = "score" | "percent_change_24h" | "volume_24h" | "market_cap";

export interface RadarFilters {
  search: string;
  signalType: SignalFilter;
  severity: SeverityFilter;
  sortBy: SortField;
  sortDesc: boolean;
}

export const DEFAULT_RADAR_FILTERS: RadarFilters = {
  search: "",
  signalType: "all",
  severity: "all",
  sortBy: "score",
  sortDesc: true,
};

function parseNum(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

export function filterAndSortRadarItems(
  items: RadarItem[],
  filters: RadarFilters
): RadarItem[] {
  let result = [...items];

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (item) =>
        item.asset.symbol.toLowerCase().includes(q) ||
        item.asset.name.toLowerCase().includes(q)
    );
  }

  if (filters.signalType === "none") {
    result = result.filter((item) => !item.main_signal || item.anomaly_score === 0);
  } else if (filters.signalType !== "all") {
    result = result.filter((item) => item.main_signal === filters.signalType);
  }

  if (filters.severity !== "all") {
    result = result.filter(
      (item) => severityFromScore(item.anomaly_score) === filters.severity
    );
  }

  const dir = filters.sortDesc ? -1 : 1;

  result.sort((a, b) => {
    switch (filters.sortBy) {
      case "percent_change_24h":
        return (
          (parseNum(a.percent_change_24h) - parseNum(b.percent_change_24h)) * dir
        );
      case "volume_24h":
        return (parseNum(a.volume_24h) - parseNum(b.volume_24h)) * dir;
      case "market_cap":
        return (parseNum(a.market_cap) - parseNum(b.market_cap)) * dir;
      case "score":
      default: {
        const aActive = a.anomaly_score > 0;
        const bActive = b.anomaly_score > 0;
        if (aActive !== bActive) {
          return aActive ? -1 : 1;
        }
        return (a.anomaly_score - b.anomaly_score) * dir;
      }
    }
  });

  return result;
}
