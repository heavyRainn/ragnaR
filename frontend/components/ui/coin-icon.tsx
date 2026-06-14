"use client";

import { useState } from "react";
import { coinIconUrl } from "@/lib/coin-icon";
import { cn } from "@/lib/utils";

interface CoinIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CoinIcon({ symbol, size = 20, className }: CoinIconProps) {
  const [failed, setFailed] = useState(false);
  const upper = symbol.toUpperCase();

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-radar-elevated font-bold text-cmc-text",
          className
        )}
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.42) }}
        aria-hidden
      >
        {upper.slice(0, 1)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coinIconUrl(upper)}
      alt=""
      width={size}
      height={size}
      className={cn("inline-block shrink-0 rounded-full object-contain", className)}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
