"use client";

import { useEffect, useState } from "react";
import { api, type SystemStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

export function DataSourceBadge() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    api.getSystemStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const isLive = status.data_source === "live";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide",
        isLive
          ? "border-cmc-up/40 bg-cmc-up/10 text-cmc-up"
          : "border-amber-500/40 bg-amber-500/10 text-amber-400"
      )}
      title={status.message}
    >
      {isLive
        ? `LIVE DATA · CoinMarketCap · Top ${status.cmc_listings_limit ?? 50}`
        : "MOCK DATA · Seeded snapshots"}
    </span>
  );
}
