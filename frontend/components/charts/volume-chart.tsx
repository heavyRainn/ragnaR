"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketSnapshot } from "@/lib/api";
import { formatDate, formatVolume } from "@/lib/format";

interface VolumeChartProps {
  snapshots: MarketSnapshot[];
}

export function VolumeChart({ snapshots }: VolumeChartProps) {
  const data = [...snapshots]
    .reverse()
    .map((s) => ({
      time: formatDate(s.captured_at),
      volume: parseFloat(s.volume_24h),
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="#6b7280"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatVolume(v)}
            width={80}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #1f2937" }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value: number) => [formatVolume(value), "Volume 24h"]}
          />
          <Bar dataKey="volume" fill="#3861fb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
