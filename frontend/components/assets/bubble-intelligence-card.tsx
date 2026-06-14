"use client";

import { AssetIdentity } from "@/components/ui/asset-identity";
import { useI18n } from "@/lib/i18n/locale-provider";
import { formatPercent, formatPrice, formatVolume } from "@/lib/format";
import type { SimBubble } from "@/lib/bubble-physics";
import { cn } from "@/lib/utils";

interface BubbleIntelligenceCardProps {
  bubble: SimBubble;
  x?: number;
  y?: number;
  containerWidth?: number;
  inline?: boolean;
}

export function BubbleIntelligenceCard({
  bubble,
  x = 0,
  y = 0,
  containerWidth = 800,
  inline = false,
}: BubbleIntelligenceCardProps) {
  const { t, signalLabel } = useI18n();
  const cardW = 220;
  const left = inline ? 0 : Math.min(Math.max(x + 18, 8), containerWidth - cardW - 8);
  const top = inline ? 0 : Math.max(y - 24, 8);

  return (
    <div
      className={cn("pointer-events-none w-[220px]", !inline && "absolute z-[200]")}
      style={inline ? undefined : { left, top }}
    >
      <div className="cb-bubble-tooltip shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        <div
          className={cn(
            "border-b border-white/[0.06] px-3 py-2",
            bubble.displayChange >= 0 ? "bg-emerald-500/[0.08]" : "bg-red-500/[0.08]"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <AssetIdentity
              symbol={bubble.symbol}
              name={bubble.name}
              size="sm"
              layout="stacked"
              className="min-w-0 flex-1"
              nameClassName="!text-[11px] !font-normal text-radar-muted"
              symbolClassName="!text-sm !font-bold text-cmc-text normal-case"
            />
            <span
              className={cn(
                "font-mono text-xs font-semibold tabular-nums",
                bubble.displayChange >= 0 ? "text-terminal-green" : "text-terminal-red"
              )}
            >
              {formatPercent(bubble.displayChange)}
            </span>
          </div>
        </div>
        <dl className="space-y-1.5 px-3 py-2.5 font-mono text-[10px]">
          <Row label={t("common.change1h")} value={formatPercent(bubble.change1h)} />
          <Row label={t("common.change24h")} value={formatPercent(bubble.change24h)} />
          <Row label={t("common.price")} value={formatPrice(bubble.price)} />
          <Row label={t("common.marketCap")} value={formatVolume(bubble.marketCapStr)} />
          <Row
            label={t("common.radarScore")}
            value={bubble.radarScore > 0 ? String(bubble.radarScore) : "—"}
            highlight={bubble.radarScore >= 60}
          />
          <Row label={t("common.signals")} value={String(bubble.signalCount)} />
          <Row label={t("common.sector")} value={bubble.sector} />
          {bubble.mainSignal && (
            <Row label={t("common.mainSignal")} value={signalLabel(bubble.mainSignal)} />
          )}
        </dl>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-radar-muted">{label}</dt>
      <dd className={cn("font-semibold tabular-nums text-cmc-text", highlight && "text-terminal-amber")}>
        {value}
      </dd>
    </div>
  );
}
