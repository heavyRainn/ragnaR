"use client";

import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";

interface EnhancedNarrativeCardProps {
  context: AssetExplanationContext;
}

export function EnhancedNarrativeCard({ context }: EnhancedNarrativeCardProps) {
  const { t } = useI18n();
  const { enhancedNarrative } = context;

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("asset.marketNarrative")}</h2>
      <Card>
        <CardContent className="py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terminal-blue">
            {t("asset.intelligenceSummary")}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-cmc-text">{enhancedNarrative.title}</h3>
          <div className="mt-4 space-y-3">
            {enhancedNarrative.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-cmc-muted">
                {p}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
