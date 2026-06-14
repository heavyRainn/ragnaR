"use client";

import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { statusAccentClass } from "@/lib/asset-explanations";
import type { AssetDetail } from "@/lib/api";
import { useI18n } from "@/lib/i18n/locale-provider";
import { severityFromScore } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScoreBadge } from "@/components/radar/score-badge";

interface CurrentStatusProps {
  detail: AssetDetail;
  context: AssetExplanationContext;
}

export function CurrentStatus({ detail, context }: CurrentStatusProps) {
  const { t } = useI18n();
  const { hasActiveAnomaly } = context;

  return (
    <section
      className={cn(
        "terminal-panel mb-8 border p-6",
        statusAccentClass(detail.anomaly_score, hasActiveAnomaly)
      )}
    >
      <h2 className="section-label mb-4">{t("asset.currentStatus")}</h2>

      {hasActiveAnomaly ? (
        <>
          <p className="font-mono text-lg font-bold tracking-wide text-cmc-text sm:text-xl">
            {context.statusHeadline}
          </p>
          <p className="mt-2 text-sm text-cmc-muted">{context.statusSubtext}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatusItem label={t("asset.activeSignal")} value={context.activeSignalLabel ?? "—"} highlight />
            <StatusItem
              label={t("asset.currentScore")}
              value={
                detail.anomaly_score > 0 ? (
                  <ScoreBadge
                    score={detail.anomaly_score}
                    severity={severityFromScore(detail.anomaly_score)}
                  />
                ) : (
                  "—"
                )
              }
            />
            <StatusItem label={t("asset.detected")} value={context.detectedAt ?? "—"} />
          </dl>
        </>
      ) : (
        <>
          <p className="font-mono text-lg font-bold tracking-wide text-radar-muted sm:text-xl">
            {context.statusHeadline}
          </p>
          <p className="mt-2 text-sm text-cmc-muted">{context.statusSubtext}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatusItem
              label={t("asset.lastDetectedSignal")}
              value={context.lastSignalLabel ?? t("asset.none")}
            />
            <StatusItem
              label={t("asset.peakScoreLabel")}
              value={context.peakScore > 0 ? String(context.peakScore) : "—"}
            />
            <StatusItem label={t("asset.currentScore")} value="0" muted />
          </dl>
        </>
      )}
    </section>
  );
}

function StatusItem({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-radar-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-mono text-sm font-semibold",
          highlight ? "text-terminal-blue" : muted ? "text-radar-muted" : "text-cmc-text"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
