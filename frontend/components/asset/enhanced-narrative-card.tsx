import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { Card, CardContent } from "@/components/ui/card";

interface EnhancedNarrativeCardProps {
  context: AssetExplanationContext;
}

export function EnhancedNarrativeCard({ context }: EnhancedNarrativeCardProps) {
  const { enhancedNarrative } = context;

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">Market Narrative</h2>
      <Card>
        <CardContent className="py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terminal-blue">
            Intelligence Summary
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
