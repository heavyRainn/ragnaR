import type { AssetExplanationContext } from "@/lib/asset-explanations";
import { formatSignalType } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/components/radar/score-badge";

interface SignalExplanationsProps {
  context: AssetExplanationContext;
}

export function SignalExplanations({ context }: SignalExplanationsProps) {
  if (context.signalExplanations.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="section-label mb-4">Signal Explanation</h2>
      <div className="space-y-3">
        {context.signalExplanations.map(({ signal, details }) => (
          <Card key={`${signal.id}-${signal.signal_type}`}>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-cmc-text">{formatSignalType(signal.signal_type)}</h3>
                <div className="flex items-center gap-2">
                  {signal.status !== "active" && (
                    <span className="font-mono text-[10px] uppercase text-radar-muted">Inactive</span>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
