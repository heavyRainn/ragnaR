import { CoinIcon } from "@/components/ui/coin-icon";
import { cn } from "@/lib/utils";

export type AssetIdentitySize = "xs" | "sm" | "md" | "lg" | "xl";

const PRESETS: Record<
  AssetIdentitySize,
  { icon: number; name: string; symbol: string }
> = {
  xs: { icon: 16, name: "text-xs font-medium", symbol: "text-[10px]" },
  sm: { icon: 20, name: "text-sm font-medium", symbol: "text-[10px]" },
  md: { icon: 24, name: "text-[15px] font-medium leading-snug", symbol: "text-[10px]" },
  lg: { icon: 32, name: "text-lg font-semibold", symbol: "text-xs" },
  xl: { icon: 44, name: "text-3xl font-bold", symbol: "text-sm" },
};

export type AssetIdentityLayout = "stacked" | "row" | "symbol";

interface AssetIdentityProps {
  symbol: string;
  name?: string | null;
  size?: AssetIdentitySize;
  layout?: AssetIdentityLayout;
  className?: string;
  nameClassName?: string;
  symbolClassName?: string;
  iconClassName?: string;
}

export function AssetIdentity({
  symbol,
  name,
  size = "sm",
  layout = "stacked",
  className,
  nameClassName,
  symbolClassName,
  iconClassName,
}: AssetIdentityProps) {
  const preset = PRESETS[size];
  const displaySymbol = symbol.toUpperCase();

  if (layout === "symbol") {
    return (
      <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
        <CoinIcon symbol={displaySymbol} size={preset.icon} className={iconClassName} />
        <span
          className={cn(
            "truncate font-mono font-semibold uppercase tracking-wide text-cmc-text",
            preset.symbol,
            symbolClassName
          )}
        >
          {displaySymbol}
        </span>
      </span>
    );
  }

  if (layout === "row") {
    return (
      <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
        <CoinIcon symbol={displaySymbol} size={preset.icon} className={iconClassName} />
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {name ? (
            <span className={cn("truncate text-cmc-text", preset.name, nameClassName)}>{name}</span>
          ) : null}
          <span
            className={cn(
              "font-mono uppercase tracking-wide text-radar-muted",
              preset.symbol,
              symbolClassName
            )}
          >
            {displaySymbol}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <CoinIcon symbol={displaySymbol} size={preset.icon} className={iconClassName} />
      <span className="min-w-0">
        {name ? (
          <span className={cn("block truncate text-cmc-text", preset.name, nameClassName)}>{name}</span>
        ) : null}
        <span
          className={cn(
            "block truncate font-mono uppercase tracking-wide text-radar-muted/80",
            name ? "mt-0.5" : "",
            preset.symbol,
            symbolClassName
          )}
        >
          {displaySymbol}
        </span>
      </span>
    </span>
  );
}
