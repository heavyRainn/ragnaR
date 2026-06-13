"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketSnapshot } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

interface PriceChartProps {
  snapshots: MarketSnapshot[];
}

export function PriceChart({ snapshots }: PriceChartProps) {
  const data = [...snapshots]
    .reverse()
    .map((s) => ({
      time: formatDate(s.captured_at),
      price: parseFloat(s.price),
    }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="#6b7280"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatPrice(v)}
            width={80}
          />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid #1f2937" }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value: number) => [formatPrice(value), "Price"]}
          />
          <Line type="monotone" dataKey="price" stroke="#16c784" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
