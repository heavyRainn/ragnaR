import type { MarketRotation, SectorRotation } from "@/lib/api";

type StoryTranslate = (key: string, vars?: Record<string, string | number>) => string;
type SectorLabelFn = (sector: string | null | undefined) => string;

const TRACKED = new Set(["AI", "DeFi", "Layer1", "Meme", "Gaming", "Infrastructure", "RWA"]);

function sectorPool(sectors: SectorRotation[]): SectorRotation[] {
  const tracked = sectors.filter((s) => TRACKED.has(s.sector));
  return tracked.length > 0 ? tracked : sectors.filter((s) => s.sector !== "Other");
}

export function resolveCapitalRotationStory(
  data: MarketRotation,
  t: StoryTranslate,
  sectorLabel: SectorLabelFn
): string {
  const pool = sectorPool(data.sectors);
  if (pool.length === 0) return t("capitalRotation.storyBalanced");

  const strongest = pool.reduce((a, b) =>
    a.average_24h_change >= b.average_24h_change ? a : b
  );
  const weakest = pool.reduce((a, b) =>
    a.average_24h_change <= b.average_24h_change ? a : b
  );
  const best1h = pool.reduce((a, b) =>
    a.average_1h_change >= b.average_1h_change ? a : b
  );
  const worst1h = pool.reduce((a, b) =>
    a.average_1h_change <= b.average_1h_change ? a : b
  );

  if (
    strongest.sector !== weakest.sector &&
    strongest.average_24h_change - weakest.average_24h_change >= 0.35
  ) {
    return t("capitalRotation.storyIntoWhileWeakens", {
      strong: sectorLabel(strongest.sector),
      weak: sectorLabel(weakest.sector),
    });
  }

  if (
    best1h.sector !== worst1h.sector &&
    best1h.average_1h_change >= 0.25 &&
    worst1h.average_1h_change <= -0.25
  ) {
    return t("capitalRotation.story1hMomentum", {
      best: sectorLabel(best1h.sector),
      worst: sectorLabel(worst1h.sector),
    });
  }

  if (strongest.average_24h_change >= 0.25) {
    return t("capitalRotation.storyLeads24h", { sector: sectorLabel(strongest.sector) });
  }

  if (weakest.average_24h_change <= -0.25) {
    return t("capitalRotation.storyUnderperforms24h", { sector: sectorLabel(weakest.sector) });
  }

  if (best1h.average_1h_change >= 0.3) {
    return t("capitalRotation.storyBest1h", { sector: sectorLabel(best1h.sector) });
  }

  if (worst1h.average_1h_change <= -0.3) {
    return t("capitalRotation.storyWorst1h", { sector: sectorLabel(worst1h.sector) });
  }

  return t("capitalRotation.storyBalanced");
}

export function trendLabel(
  trend: string,
  t: StoryTranslate
): { icon: string; label: string; className: string } {
  switch (trend) {
    case "strengthening":
      return {
        icon: "↑",
        label: t("capitalRotation.trendStrengthening"),
        className: "text-terminal-green",
      };
    case "weakening":
      return {
        icon: "↓",
        label: t("capitalRotation.trendWeakening"),
        className: "text-terminal-red",
      };
    default:
      return {
        icon: "→",
        label: t("capitalRotation.trendNeutral"),
        className: "text-radar-muted",
      };
  }
}

export function displaySectors(sectors: SectorRotation[]): SectorRotation[] {
  return sectors.filter((s) => TRACKED.has(s.sector));
}
