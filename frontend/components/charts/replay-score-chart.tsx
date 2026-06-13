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
import type { ReplayPoint } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ReplayScoreChartProps {
  points: ReplayPoint[];
  highlightIndex?: number;
}

export function ReplayScoreChart({ points, highlightIndex }: ReplayScoreChartProps) {
  const data = points.map((p, i) => ({
    time: formatDate(p.timestamp),
    score: p.anomaly_score,
    index: i,
    highlighted: highlightIndex === i,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} width={40} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: number) => [value, "Composite Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.highlighted) {
                return (
                  <circle
                    key={`dot-${payload.index}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#3b82f6"
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                );
              }
              return (
                <circle
                  key={`dot-${payload.index}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#3b82f6"
                  fillOpacity={0.5}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
