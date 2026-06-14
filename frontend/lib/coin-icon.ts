/** Public CDN icon — falls back in UI on error. */
export function coinIconUrl(symbol: string): string {
  return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${symbol.toLowerCase()}.svg`;
}
