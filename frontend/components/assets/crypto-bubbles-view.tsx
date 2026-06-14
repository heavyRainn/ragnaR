"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BubbleCoinIcon, bubbleLabelFallbackPx, bubbleLabelSize } from "@/components/assets/bubble-coin-icon";
import { BubbleDetailModal } from "@/components/assets/bubble-detail-modal";
import { BubbleIntelligenceCard } from "@/components/assets/bubble-intelligence-card";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { RadarItem } from "@/lib/api";
import { computeSectorClusters, SECTOR_COLORS, type BubbleViewMode } from "@/lib/bubble-layout";
import {
  buildSimBubbles,
  bubbleAnchor,
  bubbleSentiment,
  bubbleZIndex,
  findBubbleAt,
  formatBubblePercent,
  initPackedLayout,
  mergeSimBubbles,
  scaleRadiiToViewport,
  smoothBubbleDisplay,
  stepPhysics,
  type SimBubble,
} from "@/lib/bubble-physics";
import { cn } from "@/lib/utils";

interface CryptoBubblesViewProps {
  items: RadarItem[];
  search: string;
  viewMode: BubbleViewMode;
  showSectors: boolean;
  signalCounts: Record<string, number>;
}

const HOVER_GRACE_MS = 280;
const CARD_SMOOTH = 0.12;

export function CryptoBubblesView({
  items,
  search,
  viewMode,
  showSectors,
  signalCounts,
}: CryptoBubblesViewProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<SimBubble[]>([]);
  const positionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const sectorRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const mouseWorldRef = useRef({ x: 0, y: 0, active: false });
  const hoveredIdRef = useRef<string | null>(null);
  const hoverAnchorRef = useRef<{ x: number; y: number } | null>(null);
  const hoverGraceUntilRef = useRef(0);
  const cardPosRef = useRef({ x: 0, y: 0 });
  const showSectorsRef = useRef(showSectors);
  const sizeRef = useRef({ width: 0, height: 0 });
  const frameRef = useRef(0);
  const layoutSizeRef = useRef({ width: 0, height: 0 });

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<SimBubble | null>(null);
  const [selected, setSelected] = useState<SimBubble | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.asset.symbol.toLowerCase().includes(q) ||
        item.asset.name.toLowerCase().includes(q)
    );
  }, [items, search]);

  const bubbleDefs = useMemo(
    () => buildSimBubbles(filtered, viewMode, signalCounts),
    [filtered, viewMode, signalCounts]
  );

  const sectorList = useMemo(() => {
    const sectors = new Set(bubbleDefs.map((node) => node.sector || "Other"));
    return Array.from(sectors);
  }, [bubbleDefs]);

  useEffect(() => {
    showSectorsRef.current = showSectors;
  }, [showSectors]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layoutViewModeRef = useRef<BubbleViewMode>(viewMode);

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0 || bubbleDefs.length === 0) return;

    const prev = nodesRef.current;
    const merged = mergeSimBubbles(prev, bubbleDefs);
    const sizeChanged =
      layoutSizeRef.current.width !== size.width ||
      layoutSizeRef.current.height !== size.height;
    const viewModeChanged = layoutViewModeRef.current !== viewMode;

    const needsFullLayout =
      prev.length === 0 ||
      merged.length !== prev.length ||
      merged.every((node) => node.x === 0 && node.y === 0) ||
      sizeChanged ||
      viewModeChanged;

    if (needsFullLayout) {
      initPackedLayout(merged, size.width, size.height, viewMode);
      layoutSizeRef.current = { width: size.width, height: size.height };
      layoutViewModeRef.current = viewMode;
    } else {
      scaleRadiiToViewport(merged, size.width, size.height, viewMode);
    }

    nodesRef.current = merged;
  }, [bubbleDefs, size.width, size.height, viewMode]);

  useEffect(() => {
    let raf = 0;

    const tick = (now: number) => {
      frameRef.current++;
      const { width, height } = sizeRef.current;
      const nodes = nodesRef.current;

      if (width > 0 && height > 0 && nodes.length > 0) {
        const hoveredId = hoveredIdRef.current;

        stepPhysics(nodes, width, height, mouseWorldRef.current, now, {
          hoveredId,
          hoverAnchor: hoverAnchorRef.current,
        });
        smoothBubbleDisplay(nodes, hoveredId);

        if (mouseWorldRef.current.active) {
          const hit = findBubbleAt(nodes, mouseWorldRef.current.x, mouseWorldRef.current.y);
          const nextId = hit?.id ?? null;

          if (hit) {
            hoverGraceUntilRef.current = now + HOVER_GRACE_MS;
            if (nextId !== hoveredIdRef.current) {
              hoveredIdRef.current = nextId;
              hoverAnchorRef.current = bubbleAnchor(hit);
              setHovered({ ...hit });
            }
          } else if (now > hoverGraceUntilRef.current && hoveredIdRef.current) {
            hoveredIdRef.current = null;
            hoverAnchorRef.current = null;
            setHovered(null);
          }
        } else if (now > hoverGraceUntilRef.current && hoveredIdRef.current) {
          hoveredIdRef.current = null;
          hoverAnchorRef.current = null;
          setHovered(null);
        }

        const activeHoveredId = hoveredIdRef.current;
        for (const node of nodes) {
          const el = positionRefs.current.get(node.id);
          if (!el) continue;

          const d = node.radius * 2;
          el.style.width = `${d}px`;
          el.style.height = `${d}px`;
          el.style.zIndex = String(bubbleZIndex(node, activeHoveredId));
          el.style.transform = `translate3d(${node.displayX - node.radius}px, ${node.displayY - node.radius}px, 0)`;
          el.style.setProperty("--bubble-r", String(node.radius));
          el.dataset.large = node.radius * 2 > 220 ? "true" : "false";
        }

        if (showSectorsRef.current && frameRef.current % 30 === 0) {
          const clusters = computeSectorClusters(nodes);
          for (const cluster of clusters) {
            const el = sectorRefs.current.get(cluster.sector);
            if (!el) continue;
            el.style.transform = `translate3d(${cluster.cx - cluster.radius}px, ${cluster.cy - cluster.radius}px, 0)`;
            el.style.width = `${cluster.radius * 2}px`;
            el.style.height = `${cluster.radius * 2}px`;
          }
        }

        const card = cardRef.current;
        const pinned = activeHoveredId
          ? nodes.find((node) => node.id === activeHoveredId)
          : null;

        if (card && pinned) {
          const anchor = hoverAnchorRef.current ?? bubbleAnchor(pinned);
          const targetX = Math.min(Math.max(anchor.x + pinned.radius + 12, 8), width - 236);
          const targetY = Math.max(anchor.y - pinned.radius - 8, 8);

          cardPosRef.current.x += (targetX - cardPosRef.current.x) * CARD_SMOOTH;
          cardPosRef.current.y += (targetY - cardPosRef.current.y) * CARD_SMOOTH;
          card.style.opacity = "1";
          card.style.transform = `translate3d(${cardPosRef.current.x}px, ${cardPosRef.current.y}px, 0)`;
        } else if (card) {
          card.style.opacity = "0";
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    mouseWorldRef.current = { x: sx, y: sy, active: true };

    const hit = findBubbleAt(nodesRef.current, sx, sy);
    const nextId = hit?.id ?? null;
    const now = performance.now();

    if (hit) {
      hoverGraceUntilRef.current = now + HOVER_GRACE_MS;
      if (nextId !== hoveredIdRef.current) {
        hoveredIdRef.current = nextId;
        hoverAnchorRef.current = bubbleAnchor(hit);
        cardPosRef.current.x = hit.x + hit.radius + 12;
        cardPosRef.current.y = Math.max(hit.y - hit.radius - 8, 8);
        setHovered({ ...hit });
      }
    } else if (now > hoverGraceUntilRef.current && hoveredIdRef.current) {
      hoveredIdRef.current = null;
      hoverAnchorRef.current = null;
      setHovered(null);
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    mouseWorldRef.current.active = false;
    hoverGraceUntilRef.current = performance.now() + HOVER_GRACE_MS;
  }, []);

  const handleBubbleSelect = useCallback((bubble: SimBubble) => {
    setSelected({ ...bubble });
  }, []);

  const handleModalClose = useCallback(() => {
    setSelected(null);
  }, []);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[calc(100vh-168px)] min-h-[480px] items-center justify-center bg-radar-bg">
        <p className="text-sm text-cmc-muted">{t("assets.noSearchMatch")}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-168px)] min-h-[480px] w-full overflow-hidden bg-radar-bg"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(59,130,246,0.06)_0%,transparent_55%)]" />
      <div className="absolute inset-0 z-[1]">
        {showSectors &&
          sectorList.map((sector) => (
            <div
              key={sector}
              ref={(el) => {
                if (el) sectorRefs.current.set(sector, el);
                else sectorRefs.current.delete(sector);
              }}
              className="pointer-events-none absolute left-0 top-0 will-change-transform"
              style={{
                width: 1,
                height: 1,
                background: `radial-gradient(circle, ${SECTOR_COLORS[sector] ?? SECTOR_COLORS.Other} 0%, transparent 72%)`,
              }}
            />
          ))}

        {bubbleDefs.map((def) => (
          <BubbleNode
            key={def.id}
            def={def}
            isHovered={hovered?.id === def.id}
            isSelected={selected?.id === def.id}
            onSelect={handleBubbleSelect}
            positionRef={(el) => {
              if (el) positionRefs.current.set(def.id, el);
              else positionRefs.current.delete(def.id);
            }}
          />
        ))}
      </div>

      <div
        ref={cardRef}
        className="pointer-events-none absolute left-0 top-0 z-[150] opacity-0 will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        {hovered && !selected && <BubbleIntelligenceCard bubble={hovered} inline />}
      </div>

      {selected && <BubbleDetailModal bubble={selected} onClose={handleModalClose} />}
    </div>
  );
}

function BubbleNode({
  def,
  isHovered,
  isSelected,
  onSelect,
  positionRef,
}: {
  def: SimBubble;
  isHovered: boolean;
  isSelected: boolean;
  onSelect: (bubble: SimBubble) => void;
  positionRef: (el: HTMLDivElement | null) => void;
}) {
  const sentiment = bubbleSentiment(def.displayChange);
  const labels = bubbleLabelSize(def.targetRadius, def.symbol);
  const fallback = bubbleLabelFallbackPx(def.targetRadius, def.symbol);
  const showSignal = def.hasSignal || def.radarScore > 0;

  return (
    <div
      ref={positionRef}
      className="cb-bubble-shell absolute left-0 top-0 will-change-transform"
      style={{
        width: def.targetRadius * 2,
        height: def.targetRadius * 2,
        ["--bubble-r" as string]: def.targetRadius,
        ["--bubble-symbol-scale" as string]: String(labels.symbolScale),
      }}
      data-large={def.targetRadius * 2 > 220 ? "true" : "false"}
    >
      <div
        className={cn(
          "cb-bubble relative h-full w-full select-none",
          isHovered && "cb-bubble-hovered",
          isSelected && "cb-bubble-selected",
          sentiment === "positive" && "cb-bubble-up",
          sentiment === "negative" && "cb-bubble-down",
          sentiment === "neutral" && "cb-bubble-flat",
          showSignal && "cb-bubble-signal"
        )}
      >
        <span className="cb-bubble-body" aria-hidden />

        <button
          type="button"
          onClick={() => onSelect(def)}
          className="cb-bubble-content"
          draggable={false}
        >
          {labels.showIcon && (
            <span
              className="cb-bubble-layer cb-bubble-icon-wrap"
              style={{ top: `${labels.iconTop}%` }}
            >
              <BubbleCoinIcon
                symbol={def.symbol}
                size={fallback.icon}
                className="cb-bubble-icon"
              />
            </span>
          )}

          {labels.showSymbol && (
            <span
              className="cb-bubble-layer cb-bubble-symbol"
              style={{ top: `${labels.symbolTop}%` }}
            >
              {def.symbol}
            </span>
          )}

          {labels.showChange && (
            <span
              className="cb-bubble-layer cb-bubble-change"
              style={{ top: `${labels.changeTop}%` }}
            >
              {formatBubblePercent(def.displayChange)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
