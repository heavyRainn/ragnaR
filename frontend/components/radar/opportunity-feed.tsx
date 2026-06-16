"use client";

import Link from "next/link";
import type { OpportunityFeedItem } from "@/lib/api";
import { AssetIdentity } from "@/components/ui/asset-identity";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";
import { ScoreBadge } from "./score-badge";
import { cn } from "@/lib/utils";

interface OpportunityFeedProps {
  items: OpportunityFeedItem[];
}

export function OpportunityFeed({ items }: OpportunityFeedProps) {
  const { t, signalLabel, formatRelativeTime } = useI18n();

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("opportunityFeed.title")}</h2>
      <Card>
        <CardHeader>
          <p className="text-sm text-cmc-muted">{t("opportunityFeed.subtitle")}</p>
        </CardHeader>
        <CardContent className="divide-y divide-radar-border p-0">
          {items.length === 0 ? (
            <p className="px-5 py-8 text-sm text-cmc-muted">{t("opportunityFeed.noOpportunities")}</p>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/assets/${item.asset_symbol}`}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-radar-elevated/50"
              >
                <AssetIdentity
                  symbol={item.asset_symbol}
                  name={item.asset_name}
                  size="sm"
                  layout="stacked"
                  symbolClassName="text-terminal-blue"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cmc-text">
                    {signalLabel(item.signal_type)}
                  </p>
                  <p className="mt-1 font-mono text-xs text-radar-muted">
                    {t("opportunityFeed.score", { score: item.score })}
                    {" · "}
                    {t("opportunityFeed.detected", {
                      time: formatRelativeTime(item.detected_at),
                    })}
                    {item.sector ? ` · ${item.sector}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5 font-mono text-[10px] uppercase",
                      item.status === "active"
                        ? "border-terminal-green/40 text-terminal-green"
                        : "border-radar-border text-radar-muted"
                    )}
                  >
                    {item.status === "active" ? t("status.activeLabel") : t("status.resolvedLabel")}
                  </span>
                  <ScoreBadge score={item.score} severity={item.severity} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
