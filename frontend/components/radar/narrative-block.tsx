import type { Narrative } from "@/lib/api";
import { narrativeTypeLabel } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";

interface NarrativeBlockProps {
  narrative: Narrative;
  variant?: "default" | "compact";
}

export function NarrativeBlock({ narrative, variant = "default" }: NarrativeBlockProps) {
  if (variant === "compact") {
    return (
      <span className="rounded border border-radar-border bg-radar-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-terminal-blue">
        {narrativeTypeLabel(narrative.type)}
      </span>
    );
  }

  return (
    <Card>
      <CardContent className="py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terminal-blue">
          {narrativeTypeLabel(narrative.type)}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-cmc-text">{narrative.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-cmc-muted">{narrative.description}</p>
      </CardContent>
    </Card>
  );
}
