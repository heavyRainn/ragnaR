"use client";

import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";
import { ScoreBadge } from "@/components/radar/score-badge";

interface SignalExplanationsProps {
  context: AssetExplanationContext;
}

export function SignalExplanations({ context }: SignalExplanationsProps) {
  const { t, signalLabel } = useI18n();

  if (context.signalExplanations.length === 0) return null;

  const sectionTitle = context.hasHistoricalOnly
    ? t("asset.historicalSignalExplanation")
    : t("asset.signalExplanation");

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{sectionTitle}</h2>
      <div className="space-y-3">
        {context.signalExplanations.map(({ signal, details, summary }) => (
          <Card key={`${signal.id}-${signal.signal_type}`}>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-cmc-text">{signalLabel(signal.signal_type)}</h3>
                <div className="flex items-center gap-2">
                  {signal.status !== "active" && (
                    <span className="font-mono text-[10px] uppercase text-radar-muted">
                      {signal.status === "resolved" ? t("asset.statusResolved") : t("asset.inactive")}
                    </span>
                  )}
                  <ScoreBadge score={signal.score} severity={signal.severity} />
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-cmc-muted">
                {details.map((line) => (
                  <li key={line} className="font-mono tabular-nums">
                    {line}
                  </li>
                ))}
              </ul>
              {summary && (
                <p className="mt-3 border-t border-radar-border pt-3 text-sm leading-relaxed text-cmc-text">
                  {summary}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
