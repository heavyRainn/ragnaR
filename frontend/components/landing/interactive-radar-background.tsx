"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
}

export function InteractiveRadarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;

    const NODE_COUNT = 48;
    const GRID_RINGS = 5;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initNodes = () => {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: 1 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
      }));
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / width,
        y: e.clientY / height,
        active: true,
      };
    };

    const onMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const drawGrid = (cx: number, cy: number) => {
      const maxR = Math.max(width, height) * 0.55;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.06)";
      ctx.lineWidth = 1;

      for (let i = 1; i <= GRID_RINGS; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR / GRID_RINGS) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fill();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.35,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      gradient.addColorStop(0, "rgba(15, 23, 42, 0.3)");
      gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const parallaxX = mouse.active ? (mouse.x - 0.5) * 40 : Math.sin(time * 0.0003) * 12;
      const parallaxY = mouse.active ? (mouse.y - 0.5) * 40 : Math.cos(time * 0.00025) * 10;
      const cx = width * 0.5 + parallaxX;
      const cy = height * 0.42 + parallaxY;

      drawGrid(cx, cy);

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        if (mouse.active) {
          const dx = mouse.x * width - node.x;
          const dy = mouse.y * height - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 0) {
            node.x += (dx / dist) * 0.15;
            node.y += (dy / dist) * 0.15;
          }
        }

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        const glow = 0.4 + Math.sin(node.pulse) * 0.3;
        const r = node.radius + Math.sin(node.pulse) * 0.5;

        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.04 * glow})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${0.35 + glow * 0.35})`;
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(59, 130, 246, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.globalAlpha = 1 - dist / 120;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      if (mouse.active) {
        const mx = mouse.x * width;
        const my = mouse.y * height;
        const glowGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
        glowGrad.addColorStop(0, "rgba(59, 130, 246, 0.08)");
        glowGrad.addColorStop(1, "rgba(59, 130, 246, 0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initNodes();
    animationId = requestAnimationFrame(draw);

    window.addEventListener("resize", () => {
      resize();
      initNodes();
    });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden
    />
  );
}
