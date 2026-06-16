/** Visual sizing mode — does not change API data. */
export type BubbleViewMode = "1h" | "24h";

export const SECTOR_COLORS: Record<string, string> = {
  AI: "rgba(59, 130, 246, 0.12)",
  Layer1: "rgba(148, 163, 184, 0.10)",
  DeFi: "rgba(168, 85, 247, 0.10)",
  Meme: "rgba(245, 158, 11, 0.10)",
  Gaming: "rgba(236, 72, 153, 0.10)",
  Infrastructure: "rgba(34, 197, 94, 0.08)",
  RWA: "rgba(14, 165, 233, 0.10)",
  Other: "rgba(100, 116, 139, 0.06)",
};

export interface SectorCluster {
  sector: string;
  cx: number;
  cy: number;
  radius: number;
  color: string;
}

interface PositionedBubble {
  sector: string;
  x: number;
  y: number;
  radius: number;
}

export function computeSectorClusters(bubbles: PositionedBubble[]): SectorCluster[] {
  const groups = new Map<string, PositionedBubble[]>();
  for (const bubble of bubbles) {
    const sector = bubble.sector || "Other";
    if (!groups.has(sector)) groups.set(sector, []);
    groups.get(sector)!.push(bubble);
  }

  const clusters: SectorCluster[] = [];
  for (const [sector, items] of Array.from(groups.entries())) {
    if (items.length === 0) continue;

    let cx = 0;
    let cy = 0;
    let maxDist = 0;

    for (const bubble of items) {
      cx += bubble.x;
      cy += bubble.y;
    }
    cx /= items.length;
    cy /= items.length;

    for (const bubble of items) {
      maxDist = Math.max(maxDist, Math.hypot(bubble.x - cx, bubble.y - cy) + bubble.radius);
    }

    clusters.push({
      sector,
      cx,
      cy,
      radius: maxDist + 28,
      color: SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other,
    });
  }

  return clusters;
}
