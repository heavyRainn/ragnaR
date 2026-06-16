export function sectorPath(sector: string): string {
  return `/sectors/${encodeURIComponent(sector)}`;
}

export function sectorReplayPath(sector: string): string {
  return `/replay/sector/${encodeURIComponent(sector)}`;
}
