import Link from "next/link";
import { InteractiveRadarBackground } from "@/components/landing/interactive-radar-background";
import { Card, CardContent } from "@/components/ui/card";

const SIGNAL_CARDS = [
  {
    title: "Volume Shock",
    detail: "5.4x above baseline",
    accent: "text-terminal-amber",
    border: "border-terminal-amber/20",
  },
  {
    title: "Quiet Accumulation",
    detail: "Volume rising while price stays flat",
    accent: "text-terminal-blue",
    border: "border-terminal-blue/20",
  },
  {
    title: "Price Shock",
    detail: "Return outside normal range",
    accent: "text-terminal-red",
    border: "border-terminal-red/20",
  },
];

export default function HomePage() {
  return (
    <>
      <InteractiveRadarBackground />

      <main className="relative min-h-[calc(100vh-52px)] overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-16 sm:px-8 sm:pt-24">
          <span className="rounded-full border border-terminal-blue/30 bg-terminal-blue/5 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-terminal-blue">
            Market Intelligence Radar
          </span>

          <h1 className="mt-8 max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight text-cmc-text sm:text-5xl lg:text-6xl">
            Detect unusual crypto market behavior before it becomes obvious.
          </h1>

          <p className="mt-6 max-w-2xl text-center text-base leading-relaxed text-cmc-muted sm:text-lg">
            Crypto Market Intelligence Radar transforms CoinMarketCap market data into
            deterministic anomaly signals, narratives, and explainable market intelligence.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/radar"
              className="inline-flex items-center rounded-lg border border-terminal-blue/50 bg-terminal-blue/10 px-6 py-3 font-mono text-sm font-semibold text-terminal-blue transition hover:bg-terminal-blue/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]"
            >
              Open Market Radar
            </Link>
            <Link
              href="/replay"
              className="inline-flex items-center rounded-lg border border-radar-border bg-radar-card/80 px-6 py-3 font-mono text-sm font-semibold text-cmc-text backdrop-blur-sm transition hover:border-terminal-blue/30 hover:text-terminal-blue"
            >
              View Signal Replay
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            {SIGNAL_CARDS.map((card, i) => (
              <Card
                key={card.title}
                className={`border ${card.border} bg-radar-card/70 backdrop-blur-sm ${i === 1 ? "sm:-translate-y-2" : ""}`}
              >
                <CardContent className="py-5">
                  <p className={`font-mono text-xs uppercase tracking-wider ${card.accent}`}>
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm text-cmc-muted">{card.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-radar-muted">
            <span className="rounded border border-radar-border px-3 py-1.5">Data</span>
            <span className="text-terminal-blue">→</span>
            <span className="rounded border border-radar-border px-3 py-1.5">Signal</span>
            <span className="text-terminal-blue">→</span>
            <span className="rounded border border-radar-border px-3 py-1.5">Narrative</span>
            <span className="text-terminal-blue">→</span>
            <span className="rounded border border-radar-border px-3 py-1.5">Action</span>
          </div>

          <p className="mt-20 max-w-lg text-center text-xs leading-relaxed text-radar-muted">
            AI does not decide signals. Deterministic market logic is the source of truth.
          </p>
        </div>
      </main>
    </>
  );
}
