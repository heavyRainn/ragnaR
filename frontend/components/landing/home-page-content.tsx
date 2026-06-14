"use client";

import Link from "next/link";
import { InteractiveRadarBackground } from "@/components/landing/interactive-radar-background";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/locale-provider";

export function HomePageContent() {
  const { t } = useI18n();

  const signalCards = [
    {
      title: t("signals.volume_shock"),
      detail: t("landing.volumeShockDetail"),
      accent: "text-terminal-amber",
      border: "border-terminal-amber/20",
    },
    {
      title: t("signals.quiet_accumulation"),
      detail: t("landing.quietAccumDetail"),
      accent: "text-terminal-blue",
      border: "border-terminal-blue/20",
    },
    {
      title: t("signals.price_shock"),
      detail: t("landing.priceShockDetail"),
      accent: "text-terminal-red",
      border: "border-terminal-red/20",
    },
  ];

  return (
    <>
      <InteractiveRadarBackground />

      <main className="relative min-h-[calc(100vh-52px)] overflow-hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-16 sm:px-8 sm:pt-24">
          <span className="rounded-full border border-terminal-blue/30 bg-terminal-blue/5 px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-terminal-blue">
            {t("landing.badge")}
          </span>

          <h1 className="mt-8 max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight text-cmc-text sm:text-5xl lg:text-6xl">
            {t("landing.title")}
          </h1>

          <p className="mt-6 max-w-2xl text-center text-base leading-relaxed text-cmc-muted sm:text-lg">
            {t("landing.subtitle")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/radar"
              className="inline-flex items-center rounded-lg border border-terminal-blue/50 bg-terminal-blue/10 px-6 py-3 font-mono text-sm font-semibold text-terminal-blue transition hover:bg-terminal-blue/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.15)]"
            >
              {t("landing.openRadar")}
            </Link>
            <Link
              href="/replay"
              className="inline-flex items-center rounded-lg border border-radar-border bg-radar-card/80 px-6 py-3 font-mono text-sm font-semibold text-cmc-text backdrop-blur-sm transition hover:border-terminal-blue/30 hover:text-terminal-blue"
            >
              {t("landing.viewReplay")}
            </Link>
          </div>

          <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
            {signalCards.map((card, i) => (
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
            <span className="rounded border border-radar-border px-3 py-1.5">{t("landing.pipelineData")}</span>
            <span className="text-terminal-blue">→</span>
            <span className="rounded border border-radar-border px-3 py-1.5">{t("landing.pipelineSignal")}</span>
            <span className="text-terminal-blue">→</span>
            <span className="rounded border border-radar-border px-3 py-1.5">{t("landing.pipelineNarrative")}</span>
            <span className="text-terminal-blue">→</span>
            <span className="rounded border border-radar-border px-3 py-1.5">{t("landing.pipelineAction")}</span>
          </div>

          <p className="mt-20 max-w-lg text-center text-xs leading-relaxed text-radar-muted">
            {t("landing.footer")}
          </p>
        </div>
      </main>
    </>
  );
}
