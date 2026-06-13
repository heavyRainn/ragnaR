"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSignalMarker } from "@/lib/asset-explanations";
import type { MarketSnapshot } from "@/lib/api";
import { formatDate, formatPrice, priceAxisWidth, priceChartDomain } from "@/lib/format";
import { ChartEmptyState } from "./chart-empty-state";

interface PriceChartProps {
  snapshots: MarketSnapshot[];
  markers?: ChartSignalMarker[];
  warmingUp?: boolean;
}

export function PriceChart({ snapshots, markers = [], warmingUp }: PriceChartProps) {
  if (snapshots.length < 2) {
    return <ChartEmptyState />;
  }

  const data = [...snapshots]
    .reverse()
    .map((s) => ({
      time: formatDate(s.captured_at),
      price: parseFloat(s.price),
    }));

  const prices = data.map((d) => d.price);
  const [domainMin, domainMax] = priceChartDomain(prices);
  const yAxisWidth = priceAxisWidth(prices);

  return (
    <div className="relative h-72 w-full">
      {warmingUp && (
        <span className="absolute right-0 top-0 z-10 rounded border border-terminal-amber/30 bg-terminal-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-terminal-amber">
          Warming up history
        </span>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => formatPrice(v)}
            width={yAxisWidth}
            domain={[domainMin, domainMax]}
            allowDataOverflow
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: number) => [formatPrice(value), "Price"]}
          />
          {markers.map((marker) => (
            <ReferenceLine
              key={`${marker.time}-${marker.label}`}
              x={marker.time}
              stroke={marker.color}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: marker.label,
                position: "insideTopLeft",
                fill: marker.color,
                fontSize: 10,
              }}
            />
          ))}
          <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
