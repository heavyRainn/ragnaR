"use client";

import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

interface WhyFlaggedProps {
  context: AssetExplanationContext;
}

export function WhyFlagged({ context }: WhyFlaggedProps) {
  const { t } = useI18n();

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">{t("asset.whyFlagged")}</h2>
      <Card className="border-terminal-blue/20">
        <CardContent className="space-y-4 py-6">
          {context.whyFlaggedParagraphs.map((paragraph, i) => (
            <p
              key={i}
              className={cn(
                "text-sm leading-relaxed",
                i === 0 ? "text-base font-medium text-cmc-text" : "text-cmc-muted"
              )}
            >
              {paragraph}
            </p>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
