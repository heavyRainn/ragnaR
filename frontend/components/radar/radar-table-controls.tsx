"use client";

import type { RadarFilters, SeverityFilter, SignalFilter, SortField } from "@/lib/radar-filters";
import { DEFAULT_RADAR_FILTERS } from "@/lib/radar-filters";
import { useI18n } from "@/lib/i18n/locale-provider";

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
  const { t } = useI18n();
  const set = (patch: Partial<RadarFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          placeholder={t("common.searchAsset")}
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className={`w-full sm:min-w-[200px] sm:flex-1 ${selectClass}`}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <select
          value={filters.signalType}
          onChange={(e) => set({ signalType: e.target.value as SignalFilter })}
          className={`w-full ${selectClass}`}
        >
          <option value="all">{t("radar.allSignals")}</option>
          <option value="volume_shock">{t("signals.volume_shock")}</option>
          <option value="price_shock">{t("signals.price_shock")}</option>
          <option value="quiet_accumulation">{t("signals.quiet_accumulation")}</option>
          <option value="none">{t("signals.none")}</option>
        </select>
        <select
          value={filters.severity}
          onChange={(e) => set({ severity: e.target.value as SeverityFilter })}
          className={`w-full ${selectClass}`}
        >
          <option value="all">{t("severity.all")}</option>
          <option value="critical">{t("severity.criticalRange")}</option>
          <option value="significant">{t("severity.significantRange")}</option>
          <option value="watch">{t("severity.watchRange")}</option>
          <option value="normal">{t("severity.normalRange")}</option>
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => set({ sortBy: e.target.value as SortField })}
          className={`w-full ${selectClass}`}
        >
          <option value="score">{t("radar.sortScore")}</option>
          <option value="percent_change_1h">{t("radar.sortChange1h")}</option>
          <option value="percent_change_24h">{t("radar.sortChange")}</option>
          <option value="volume_24h">{t("radar.sortVolume")}</option>
          <option value="market_cap">{t("radar.sortMcap")}</option>
        </select>
        <button
          type="button"
          onClick={() => set({ sortDesc: !filters.sortDesc })}
          className={`w-full sm:w-auto ${selectClass} font-mono text-xs`}
          title={t("radar.toggleSort")}
        >
          {filters.sortDesc ? t("common.desc") : t("common.asc")}
        </button>
        {(filters.search ||
          filters.signalType !== DEFAULT_RADAR_FILTERS.signalType ||
          filters.severity !== DEFAULT_RADAR_FILTERS.severity) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_RADAR_FILTERS)}
            className="col-span-2 text-sm text-terminal-blue hover:underline sm:col-span-1"
          >
            {t("common.reset")}
          </button>
        )}
        </div>
      </div>
      <p className="text-xs text-radar-muted">
        {t("common.showingOf", { filtered: filteredCount, total: totalCount })}
      </p>
    </div>
  );
}
