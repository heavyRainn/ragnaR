"use client";

import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";

interface KeyFindingsProps {
  context: AssetExplanationContext;
}

export function KeyFindings({ context }: KeyFindingsProps) {
  const { t } = useI18n();

  return (
    <section>
      <h2 className="section-label mb-4">{t("asset.keyFindings")}</h2>
      <Card>
        <CardContent className="py-5">
          <ul className="space-y-3">
            {context.keyFindings.map((finding) => (
              <li key={finding} className="flex items-start gap-2.5 text-sm text-cmc-text">
                <span className="mt-0.5 text-terminal-green" aria-hidden>
                  ✓
                </span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
