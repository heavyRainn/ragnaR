import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { Card, CardContent } from "@/components/ui/card";

interface WhatChangedProps {
  context: AssetExplanationContext;
}

export function WhatChanged({ context }: WhatChangedProps) {
  if (context.whatChanged.length === 0) {
    return (
      <section>
        <h2 className="section-label mb-4">What Changed</h2>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-cmc-muted">No significant changes from the previous snapshot.</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-label mb-4">What Changed</h2>
      <Card className="border-terminal-amber/20">
        <CardContent className="divide-y divide-radar-border py-0">
          {context.whatChanged.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-center justify-between gap-2 py-3.5 first:pt-5 last:pb-5"
            >
              <span className="text-sm text-radar-muted">{row.label}</span>
              <span className="font-mono text-sm tabular-nums text-cmc-text">
                <span className="text-radar-muted">{row.before}</span>
                <span className="mx-2 text-terminal-blue">→</span>
                <span className="font-semibold">{row.after}</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
