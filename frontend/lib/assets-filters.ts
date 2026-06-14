/** Stablecoins and USD-pegged tokens excluded from the bubble map. */
export const BUBBLE_EXCLUDED_SYMBOLS = new Set([
  "USDT",
  "USDC",
  "DAI",
  "USDE",
  "FDUSD",
  "TUSD",
  "USDD",
  "USDS",
  "PYUSD",
  "BUSD",
  "USDP",
  "GUSD",
  "FRAX",
  "LUSD",
  "RLUSD",
  "USDG",
  "USYC",
  "USDT0",
  "UST",
  "EURT",
  "XUSD",
  "USD1",
  "USD0",
  "USDX",
  "SUSD",
  "CUSDT",
]);

export function isUsdtRelatedSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  if (BUBBLE_EXCLUDED_SYMBOLS.has(upper)) return true;
  if (upper.includes("USDT")) return true;
  return false;
}

export function isBubbleExcludedAsset(asset: { symbol: string; name?: string | null }): boolean {
  if (isUsdtRelatedSymbol(asset.symbol)) return true;
  const name = asset.name?.toLowerCase() ?? "";
  if (name.includes("tether")) return true;
  if (/\busd\b/.test(name) && /stable|pegged|ripple usd|usd coin/.test(name)) return true;
  return false;
}

/** All tracked assets except stables / USDT-pegged tokens. */
export function isBubbleEligibleItem(item: {
  asset: { symbol: string; name?: string | null };
  percent_change_24h: string | null;
}): boolean {
  return !isBubbleExcludedAsset(item.asset);
}
