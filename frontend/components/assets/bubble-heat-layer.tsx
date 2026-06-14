"use client";

import { useEffect, useRef } from "react";

interface BubbleHeatLayerProps {
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export function BubbleHeatLayer({ width, height }: BubbleHeatLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(48, Math.floor((width * height) / 18000));
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.08 + Math.random() * 0.12,
    }));

    let frame = 0;
    let raf = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      const t = frame * 0.002;
      const g1 = ctx.createRadialGradient(
        width * (0.45 + Math.sin(t * 0.3) * 0.05),
        height * (0.4 + Math.cos(t * 0.25) * 0.04),
        0,
        width * 0.5,
        height * 0.45,
        Math.max(width, height) * 0.55
      );
      g1.addColorStop(0, "rgba(59, 130, 246, 0.06)");
      g1.addColorStop(0.5, "rgba(34, 197, 94, 0.02)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const g2 = ctx.createRadialGradient(
        width * 0.7,
        height * 0.65,
        0,
        width * 0.7,
        height * 0.65,
        width * 0.35
      );
      g2.addColorStop(0, "rgba(239, 68, 68, 0.03)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
    />
  );
}
