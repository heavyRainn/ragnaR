import type { RadarItem } from "@/lib/api";
import type { BubbleViewMode } from "@/lib/bubble-layout";

export const MIN_RADIUS = 44;
export const MAX_RADIUS = 140;

export const PHYSICS = {
  COLLISION_FORCE: 0.13,
  DAMPING: 0.978,
  COLLISION_GAP: 6,
  DRIFT_IMPULSE_MIN: 0.014,
  DRIFT_IMPULSE_MAX: 0.032,
  DRIFT_INTERVAL_MIN_MS: 2200,
  DRIFT_INTERVAL_MAX_MS: 4800,
  BREATH_FORCE: 0.00085,
  RADIUS_LERP: 0.065,
  BOUNDS_PADDING: 8,
  WALL_BOUNCE: 0.5,
  MAX_SPEED: 0.38,
  MOUSE_RADIUS: 55,
  MOUSE_FORCE: 0.002,
  HOVER_PIN_STRENGTH: 0.16,
  HOVER_DAMPING: 0.04,
  PACK_SETTLE_ITERATIONS: 520,
  PACK_RESOLVE_PASSES: 2,
  DISPLAY_SMOOTH: 0.11,
} as const;

export type BubbleSentiment = "positive" | "negative" | "neutral";

export type SimBubble = {
  id: string;
  symbol: string;
  slug: string | null;
  name: string;
  sector: string;
  x: number;
  y: number;
  displayX: number;
  displayY: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  change1h: number;
  change24h: number;
  displayChange: number;
  marketCap: number;
  radarScore: number;
  signalCount: number;
  price: string | null;
  marketCapStr: string | null;
  mainSignal: string | null;
  hasSignal: boolean;
  mass: number;
  phase: number;
  nextDriftAt: number;
};

export interface PhysicsContext {
  hoveredId: string | null;
  hoverAnchor: { x: number; y: number } | null;
}

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h * 0.013;
}

function clampSpeed(node: SimBubble): void {
  const speed = Math.hypot(node.vx, node.vy);
  if (speed > PHYSICS.MAX_SPEED) {
    const scale = PHYSICS.MAX_SPEED / speed;
    node.vx *= scale;
    node.vy *= scale;
  }
}

/** Cap extreme % moves so one outlier does not dominate the whole map. */
const SIZE_PERCENT_CAP = 8;

/** Final viewport multiplier per mode (1h slightly denser than 24h). */
const MODE_RADIUS_SCALE: Record<BubbleViewMode, number> = {
  "1h": 0.68,
  "24h": 1.08,
};

/** Modest global bump — larger bubbles, same circular dynamic layout. */
const BUBBLE_RADIUS_BOOST = 1.12;

function normalizedPerfMetric(change: number): number {
  const abs = Math.min(Math.abs(change), SIZE_PERCENT_CAP);
  return Math.max(Math.pow(abs, 0.72), 0.06);
}

function sizingMetric(item: RadarItem, mode: BubbleViewMode): number {
  const change1h = parseFloat(item.percent_change_1h ?? "0") || 0;
  const change24h = parseFloat(item.percent_change_24h ?? "0") || 0;
  return normalizedPerfMetric(mode === "1h" ? change1h : change24h);
}

function sizeCurve(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return Math.pow(clamped, 0.4);
}

function baseRadiusFromNormalized(t: number): number {
  const curved = sizeCurve(t);
  return MIN_RADIUS + curved * (MAX_RADIUS - MIN_RADIUS);
}

/** Uniform scale — preserves relative bubble sizes, tuned for dense heatmap fill. */
export function scaleRadiiToViewport(
  nodes: SimBubble[],
  width: number,
  height: number,
  viewMode: BubbleViewMode = "24h"
): void {
  if (nodes.length === 0) return;

  const n = nodes.length;
  const area = width * height;
  const minDim = Math.min(width, height);
  const modeScale = MODE_RADIUS_SCALE[viewMode] ?? 1;
  const targetFill = Math.min(0.84, 0.56 + n * 0.0034);
  const sumArea = nodes.reduce((sum, node) => sum + Math.PI * node.targetRadius * node.targetRadius, 0);

  const maxR = minDim * (n > 42 ? 0.18 : n > 28 ? 0.2 : 0.23);
  const minR = minDim * (n > 42 ? 0.036 : 0.04);

  const scale = Math.sqrt((area * targetFill) / (sumArea || 1));
  for (const node of nodes) {
    node.targetRadius *= scale;
  }

  let maxTarget = Math.max(...nodes.map((node) => node.targetRadius));
  if (maxTarget > maxR) {
    const down = maxR / maxTarget;
    for (const node of nodes) {
      node.targetRadius *= down;
    }
    maxTarget = maxR;
  }

  const minTarget = Math.min(...nodes.map((node) => node.targetRadius));
  if (minTarget < minR && minTarget > 0) {
    const up = Math.min(minR / minTarget, maxR / maxTarget);
    for (const node of nodes) {
      node.targetRadius *= up;
    }
  }

  for (const node of nodes) {
    node.targetRadius *= modeScale * BUBBLE_RADIUS_BOOST;
    node.radius = node.targetRadius;
    node.mass = Math.max(0.85, node.targetRadius / 38);
  }
}

export function buildSimBubbles(
  items: RadarItem[],
  viewMode: BubbleViewMode,
  signalCounts: Record<string, number>
): SimBubble[] {
  if (items.length === 0) return [];

  const metrics = items.map((item) => sizingMetric(item, viewMode));
  const min = Math.min(...metrics);
  const max = Math.max(...metrics);
  const span = max - min || 1;

  return items.map((item) => {
    const sym = item.asset.symbol;
    const metric = sizingMetric(item, viewMode);
    const t = (metric - min) / span;
    const targetRadius = baseRadiusFromNormalized(t);
    const mcap = parseFloat(item.market_cap ?? "0") || 0;
    const count = signalCounts[sym] ?? (item.anomaly_score > 0 ? 1 : 0);

    const change1h = parseFloat(item.percent_change_1h ?? "0") || 0;
    const change24h = parseFloat(item.percent_change_24h ?? "0") || 0;
    const displayChange = viewMode === "1h" ? change1h : change24h;

    return {
      id: String(item.asset.id),
      symbol: sym,
      slug: item.asset.slug,
      name: item.asset.name,
      sector: item.asset.category ?? "Other",
      x: 0,
      y: 0,
      displayX: 0,
      displayY: 0,
      vx: 0,
      vy: 0,
      radius: targetRadius,
      targetRadius,
      change1h,
      change24h,
      displayChange,
      marketCap: mcap,
      radarScore: item.anomaly_score,
      signalCount: count,
      price: item.price,
      marketCapStr: item.market_cap,
      mainSignal: item.main_signal,
      hasSignal: item.anomaly_score > 0,
      mass: Math.max(0.8, targetRadius / 42),
      phase: hashPhase(sym),
      nextDriftAt: performance.now() + Math.random() * 3000,
    };
  });
}

export function mergeSimBubbles(prev: SimBubble[], next: SimBubble[]): SimBubble[] {
  const prevMap = new Map(prev.map((node) => [node.id, node]));

  return next.map((node) => {
    const existing = prevMap.get(node.id);
    if (!existing) return { ...node };

    return {
      ...node,
      x: existing.x,
      y: existing.y,
      displayX: existing.displayX,
      displayY: existing.displayY,
      vx: existing.vx,
      vy: existing.vy,
      radius: existing.radius,
      nextDriftAt: existing.nextDriftAt,
    };
  });
}

function clampInside(node: SimBubble, width: number, height: number): void {
  const pad = PHYSICS.BOUNDS_PADDING;
  node.x = Math.min(width - node.radius - pad, Math.max(node.radius + pad, node.x));
  node.y = Math.min(height - node.radius - pad, Math.max(node.radius + pad, node.y));
}

function minDist(a: SimBubble, b: SimBubble): number {
  return a.radius + b.radius + PHYSICS.COLLISION_GAP;
}

function overlapsPlaced(node: SimBubble, placed: SimBubble[]): boolean {
  for (const other of placed) {
    const dist = Math.hypot(node.x - other.x, node.y - other.y);
    if (dist < minDist(node, other)) return true;
  }
  return false;
}

function separatePair(a: SimBubble, b: SimBubble, pinnedId: string | null): void {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let dist = Math.hypot(dx, dy);
  const need = minDist(a, b);

  if (dist < 1e-4) {
    const angle = (hashPhase(a.id + b.id) * 17) % (Math.PI * 2);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    dist = 1;
  }

  if (dist >= need) return;

  const overlap = need - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  const aPinned = a.id === pinnedId;
  const bPinned = b.id === pinnedId;

  if (aPinned && bPinned) return;

  if (aPinned) {
    b.x += nx * overlap;
    b.y += ny * overlap;
    return;
  }
  if (bPinned) {
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    return;
  }

  const total = a.mass + b.mass;
  const moveA = overlap * (b.mass / total);
  const moveB = overlap * (a.mass / total);
  a.x -= nx * moveA;
  a.y -= ny * moveA;
  b.x += nx * moveB;
  b.y += ny * moveB;
}

function resolveOverlaps(
  nodes: SimBubble[],
  width: number,
  height: number,
  pinnedId: string | null = null
): void {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      separatePair(nodes[i], nodes[j], pinnedId);
    }
  }
  for (const node of nodes) {
    clampInside(node, width, height);
  }
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function findPackedSlot(
  node: SimBubble,
  placed: SimBubble[],
  cx: number,
  cy: number,
  width: number,
  height: number
): boolean {
  const gap = PHYSICS.COLLISION_GAP + 2;
  let bestX = cx;
  let bestY = cy;
  let bestScore = Infinity;
  let hasBest = false;

  const tryCandidate = (x: number, y: number) => {
    node.x = x;
    node.y = y;
    clampInside(node, width, height);
    if (overlapsPlaced(node, placed)) return;
    const score = Math.hypot(node.x - cx, node.y - cy);
    if (!hasBest || score < bestScore) {
      bestX = node.x;
      bestY = node.y;
      bestScore = score;
      hasBest = true;
    }
  };

  if (placed.length === 0) {
    node.x = cx;
    node.y = cy;
    return true;
  }

  for (const anchor of placed) {
    const orbit = anchor.radius + node.radius + gap;
    const steps = Math.max(14, Math.ceil(orbit / 4));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2 + node.phase;
      tryCandidate(anchor.x + Math.cos(angle) * orbit, anchor.y + Math.sin(angle) * orbit);
    }
  }

  const maxPlacedR = placed[0]?.radius ?? node.radius;
  for (let i = 0; i < 5000; i++) {
    const angle = i * GOLDEN_ANGLE + node.phase * 3;
    const dist = maxPlacedR + node.radius + gap + i * 0.28;
    tryCandidate(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
  }

  if (hasBest) {
    node.x = bestX;
    node.y = bestY;
    return true;
  }

  return false;
}

function settleLayout(nodes: SimBubble[], width: number, height: number): void {
  for (let i = 0; i < PHYSICS.PACK_SETTLE_ITERATIONS; i++) {
    resolveOverlaps(nodes, width, height, null);

    const t = i / PHYSICS.PACK_SETTLE_ITERATIONS;
    const cx = width / 2;
    const cy = height / 2;
    const pull = 0.0015 * (1 - t);
    for (const node of nodes) {
      node.x += (cx - node.x) * pull;
      node.y += (cy - node.y) * pull;
      clampInside(node, width, height);
    }
  }

  for (const node of nodes) {
    node.vx = 0;
    node.vy = 0;
  }
}

export function initPackedLayout(
  nodes: SimBubble[],
  width: number,
  height: number,
  viewMode: BubbleViewMode = "24h"
): void {
  if (width <= 0 || height <= 0 || nodes.length === 0) return;

  scaleRadiiToViewport(nodes, width, height, viewMode);

  const sorted = [...nodes].sort((a, b) => b.targetRadius - a.targetRadius);
  const cx = width / 2;
  const cy = height / 2;
  const now = performance.now();
  const placed: SimBubble[] = [];

  for (const node of sorted) {
    if (!findPackedSlot(node, placed, cx, cy, width, height)) {
      node.x = cx + (Math.random() - 0.5) * width * 0.35;
      node.y = cy + (Math.random() - 0.5) * height * 0.35;
      clampInside(node, width, height);
    }

    node.radius = node.targetRadius;
    node.displayX = node.x;
    node.displayY = node.y;
    node.vx = (Math.random() - 0.5) * 0.12;
    node.vy = (Math.random() - 0.5) * 0.12;
    node.nextDriftAt =
      now + PHYSICS.DRIFT_INTERVAL_MIN_MS + Math.random() * PHYSICS.DRIFT_INTERVAL_MAX_MS;
    placed.push(node);
  }

  settleLayout(nodes, width, height);
  for (const node of nodes) {
    node.displayX = node.x;
    node.displayY = node.y;
  }
}

export function initSpiralLayout(nodes: SimBubble[], width: number, height: number): void {
  initPackedLayout(nodes, width, height);
}

export function initNewNodes(nodes: SimBubble[], width: number, height: number): void {
  const needsLayout = nodes.filter((n) => n.x === 0 && n.y === 0);
  if (needsLayout.length === 0) return;
  initPackedLayout(needsLayout, width, height);
}

function applyCollision(a: SimBubble, b: SimBubble, hoveredId: string | null): void {
  separatePair(a, b, hoveredId);

  let dx = b.x - a.x;
  let dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const need = minDist(a, b);
  if (dist >= need) return;

  const overlap = need - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  const force = overlap * PHYSICS.COLLISION_FORCE;
  const aPinned = a.id === hoveredId;
  const bPinned = b.id === hoveredId;

  if (!aPinned) {
    a.vx -= (nx * force) / a.mass;
    a.vy -= (ny * force) / a.mass;
  }
  if (!bPinned) {
    b.vx += (nx * force) / b.mass;
    b.vy += (ny * force) / b.mass;
  }
}

function applyZeroGravityDrift(node: SimBubble, timeMs: number): void {
  if (timeMs >= node.nextDriftAt) {
    node.nextDriftAt =
      timeMs +
      PHYSICS.DRIFT_INTERVAL_MIN_MS +
      Math.random() * (PHYSICS.DRIFT_INTERVAL_MAX_MS - PHYSICS.DRIFT_INTERVAL_MIN_MS);

    const impulse =
      PHYSICS.DRIFT_IMPULSE_MIN +
      Math.random() * (PHYSICS.DRIFT_IMPULSE_MAX - PHYSICS.DRIFT_IMPULSE_MIN);
    const angle = Math.random() * Math.PI * 2;
    node.vx += (Math.cos(angle) * impulse) / node.mass;
    node.vy += (Math.sin(angle) * impulse) / node.mass;
  }

  const t = timeMs * 0.001;
  node.vx += (Math.sin(t * 0.62 + node.phase) * PHYSICS.BREATH_FORCE) / node.mass;
  node.vy += (Math.cos(t * 0.54 + node.phase * 1.1) * PHYSICS.BREATH_FORCE) / node.mass;
}

function applyMouseRepulsion(
  node: SimBubble,
  mouse: { x: number; y: number; active: boolean },
  hoveredId: string | null
): void {
  if (!mouse.active || node.id === hoveredId) return;

  const dx = node.x - mouse.x;
  const dy = node.y - mouse.y;
  const dist = Math.hypot(dx, dy) || 1;

  if (dist <= node.radius + 4) return;
  if (dist >= PHYSICS.MOUSE_RADIUS) return;

  const strength = (1 - dist / PHYSICS.MOUSE_RADIUS) ** 2;
  const push = (strength * PHYSICS.MOUSE_FORCE) / node.mass;
  node.vx += (dx / dist) * push;
  node.vy += (dy / dist) * push;
}

function pinHoveredBubble(node: SimBubble, anchor: { x: number; y: number }): void {
  node.vx *= PHYSICS.HOVER_DAMPING;
  node.vy *= PHYSICS.HOVER_DAMPING;
  node.x += (anchor.x - node.x) * PHYSICS.HOVER_PIN_STRENGTH;
  node.y += (anchor.y - node.y) * PHYSICS.HOVER_PIN_STRENGTH;
  node.displayX += (node.x - node.displayX) * 0.2;
  node.displayY += (node.y - node.displayY) * 0.2;

  if (Math.abs(node.vx) < 0.001) node.vx = 0;
  if (Math.abs(node.vy) < 0.001) node.vy = 0;
}

function applyWallBounce(node: SimBubble, width: number, height: number): void {
  const pad = PHYSICS.BOUNDS_PADDING;
  const minX = node.radius + pad;
  const maxX = width - node.radius - pad;
  const minY = node.radius + pad;
  const maxY = height - node.radius - pad;

  if (node.x < minX) {
    node.x = minX;
    node.vx = Math.abs(node.vx) * PHYSICS.WALL_BOUNCE;
  } else if (node.x > maxX) {
    node.x = maxX;
    node.vx = -Math.abs(node.vx) * PHYSICS.WALL_BOUNCE;
  }

  if (node.y < minY) {
    node.y = minY;
    node.vy = Math.abs(node.vy) * PHYSICS.WALL_BOUNCE;
  } else if (node.y > maxY) {
    node.y = maxY;
    node.vy = -Math.abs(node.vy) * PHYSICS.WALL_BOUNCE;
  }
}

export function stepPhysics(
  nodes: SimBubble[],
  width: number,
  height: number,
  mouse: { x: number; y: number; active: boolean },
  timeMs: number,
  ctx: PhysicsContext
): void {
  if (width <= 0 || height <= 0 || nodes.length === 0) return;

  const { hoveredId, hoverAnchor } = ctx;

  for (const node of nodes) {
    node.radius += (node.targetRadius - node.radius) * PHYSICS.RADIUS_LERP;
  }

  for (const node of nodes) {
    if (node.id === hoveredId && hoverAnchor) {
      pinHoveredBubble(node, hoverAnchor);
      continue;
    }

    applyZeroGravityDrift(node, timeMs);
    applyMouseRepulsion(node, mouse, hoveredId);
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      applyCollision(nodes[i], nodes[j], hoveredId);
    }
  }

  for (let pass = 0; pass < PHYSICS.PACK_RESOLVE_PASSES; pass++) {
    resolveOverlaps(nodes, width, height, hoveredId);
  }

  for (const node of nodes) {
    if (node.id === hoveredId) {
      clampInside(node, width, height);
      continue;
    }

    node.vx *= PHYSICS.DAMPING;
    node.vy *= PHYSICS.DAMPING;
    node.x += node.vx;
    node.y += node.vy;
    clampSpeed(node);
    applyWallBounce(node, width, height);
  }
}

export function findBubbleAt(
  nodes: SimBubble[],
  px: number,
  py: number,
  hitPadding = 4
): SimBubble | null {
  const sorted = [...nodes].sort((a, b) => b.radius - a.radius);
  for (const node of sorted) {
    if (Math.hypot(node.x - px, node.y - py) <= node.radius + hitPadding) return node;
  }
  return null;
}

export function bubbleSentiment(change: number): BubbleSentiment {
  if (Math.abs(change) < 0.05) return "neutral";
  return change > 0 ? "positive" : "negative";
}

export function bubbleZIndex(node: SimBubble, hoveredId: string | null): number {
  if (node.id === hoveredId) return 1000;
  return Math.round(node.radius);
}

export function settleBubbleLayout(nodes: SimBubble[], width: number, height: number): void {
  settleLayout(nodes, width, height);
  for (const node of nodes) {
    node.displayX = node.x;
    node.displayY = node.y;
  }
}

/** Scale positions and radii when the viewport changes — avoids full repack jitter. */
export function resizeBubbleLayout(
  nodes: SimBubble[],
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  viewMode: BubbleViewMode = "24h"
): void {
  if (nodes.length === 0 || oldWidth <= 0 || oldHeight <= 0 || newWidth <= 0 || newHeight <= 0) {
    return;
  }

  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;
  const cxOld = oldWidth / 2;
  const cyOld = oldHeight / 2;
  const cxNew = newWidth / 2;
  const cyNew = newHeight / 2;

  for (const node of nodes) {
    node.x = cxNew + (node.x - cxOld) * scaleX;
    node.y = cyNew + (node.y - cyOld) * scaleY;
    node.displayX = cxNew + (node.displayX - cxOld) * scaleX;
    node.displayY = cyNew + (node.displayY - cyOld) * scaleY;
    node.vx *= 0.25;
    node.vy *= 0.25;
  }

  scaleRadiiToViewport(nodes, newWidth, newHeight, viewMode);
  settleBubbleLayout(nodes, newWidth, newHeight);
}

export function smoothBubbleDisplay(nodes: SimBubble[], hoveredId: string | null): void {
  const smooth =
    hoveredId !== null ? PHYSICS.DISPLAY_SMOOTH * 1.4 : PHYSICS.DISPLAY_SMOOTH;

  for (const node of nodes) {
    node.displayX += (node.x - node.displayX) * smooth;
    node.displayY += (node.y - node.displayY) * smooth;
  }
}

export function bubbleAnchor(node: SimBubble): { x: number; y: number } {
  return { x: node.x, y: node.y };
}

export function formatBubblePercent(change: number): string {
  const sign = change >= 0 ? "+" : "";
  const abs = Math.abs(change);
  const decimals = abs >= 10 ? 1 : 2;
  return `${sign}${change.toFixed(decimals)}%`;
}
