"use client";

import type { RadarFilters, SeverityFilter, SignalFilter, SortField } from "@/lib/radar-filters";
import { DEFAULT_RADAR_FILTERS } from "@/lib/radar-filters";

interface RadarTableControlsProps {
  filters: RadarFilters;
  onChange: (filters: RadarFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const selectClass =
  "rounded-md border border-radar-border bg-radar-elevated px-3 py-2 text-sm text-cmc-text focus:border-terminal-blue focus:outline-none";

export function RadarTableControls({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: RadarTableControlsProps) {
  const set = (patch: Partial<RadarFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search asset or symbol..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className={`min-w-[200px] flex-1 ${selectClass}`}
        />
        <select
          value={filters.signalType}
          onChange={(e) => set({ signalType: e.target.value as SignalFilter })}
          className={selectClass}
        >
          <option value="all">All signals</option>
          <option value="volume_shock">Volume Shock</option>
          <option value="price_shock">Price Shock</option>
          <option value="quiet_accumulation">Quiet Accumulation</option>
          <option value="none">No signal</option>
        </select>
        <select
          value={filters.severity}
          onChange={(e) => set({ severity: e.target.value as SeverityFilter })}
          className={selectClass}
        >
          <option value="all">All severity</option>
          <option value="critical">Critical (80+)</option>
          <option value="significant">Significant (60–79)</option>
          <option value="watch">Watch (40–59)</option>
          <option value="normal">Normal (0–39)</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => set({ sortBy: e.target.value as SortField })}
          className={selectClass}
        >
          <option value="score">Radar Score</option>
          <option value="percent_change_24h">24h %</option>
          <option value="volume_24h">Volume</option>
          <option value="market_cap">Market Cap</option>
        </select>
        <button
          type="button"
          onClick={() => set({ sortDesc: !filters.sortDesc })}
          className={`${selectClass} font-mono text-xs`}
          title="Toggle sort direction"
        >
          {filters.sortDesc ? "↓ Desc" : "↑ Asc"}
        </button>
        {(filters.search ||
          filters.signalType !== DEFAULT_RADAR_FILTERS.signalType ||
          filters.severity !== DEFAULT_RADAR_FILTERS.severity) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_RADAR_FILTERS)}
            className="text-sm text-terminal-blue hover:underline"
          >
            Reset
          </button>
        )}
      </div>
      <p className="text-xs text-radar-muted">
        Showing {filteredCount} of {totalCount} assets
      </p>
    </div>
  );
}
