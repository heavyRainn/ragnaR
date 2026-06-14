import type { MarketSnapshot } from "@/lib/api";

function parseNum(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Comparable volume for intraday charts — mirrors backend snapshot_shock_volume. */
export function chartVolumeValue(snapshot: MarketSnapshot): number {
  return volumeFromFields(snapshot);
}

export type ChartVolumeUnit = "1m" | "24h";

/** Which unit dominates the snapshot series (for axis / tooltip labels). */
export function chartVolumeUnit(snapshots: MarketSnapshot[]): ChartVolumeUnit {
  return chartVolumeUnitFromRows(snapshots);
}

export function chartVolumeUnitFromRows(rows: VolumeLike[]): ChartVolumeUnit {
  const with1m = rows.filter((s) => parseNum(s.volume_1m) > 0).length;
  const with24hOnly = rows.filter(
    (s) => parseNum(s.volume_24h) > 0 && parseNum(s.volume_1m) <= 0
  ).length;
  return with1m >= with24hOnly ? "1m" : "24h";
}

/** Latest headline 24h volume (CMC field) for metric cards. */
export function headlineVolume24h(snapshot: MarketSnapshot | null | undefined): number | null {
  if (!snapshot) return null;
  const v24 = parseNum(snapshot.volume_24h);
  return v24 > 0 ? v24 : null;
}

type VolumeLike = Pick<MarketSnapshot, "volume_24h" | "volume_1m">;

export function volumeFromFields(row: VolumeLike): number {
  const v1m = parseNum(row.volume_1m);
  const v24 = parseNum(row.volume_24h);
  if (v1m > 0) return v1m;
  if (v24 > 0) return v24;
  return 0;
}
