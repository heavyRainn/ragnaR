"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartSignalMarker } from "@/lib/asset-explanations";
import type { MarketSnapshot } from "@/lib/api";
import { chartVolumeUnit, chartVolumeValue } from "@/lib/chart-volume";
import { formatDate, formatVolume } from "@/lib/format";
import { useI18n } from "@/lib/i18n/locale-provider";
import { ChartEmptyState } from "./chart-empty-state";

interface VolumeChartProps {
  snapshots: MarketSnapshot[];
  markers?: ChartSignalMarker[];
}

export function VolumeChart({ snapshots, markers = [] }: VolumeChartProps) {
  const { t } = useI18n();

  if (snapshots.length < 2) {
    return <ChartEmptyState />;
  }

  const unit = chartVolumeUnit(snapshots);
  const volumeLabel = unit === "1m" ? t("asset.chartVolume1m") : t("asset.chartVolume24h");

  const data = snapshots.map((s) => ({
    time: formatDate(s.captured_at),
    volume: chartVolumeValue(s),
  }));

  const nonZero = data.filter((d) => d.volume > 0);
  if (nonZero.length < 1) {
    return <ChartEmptyState />;
  }

  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatVolume(v)}
            width={80}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "6px",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => [formatVolume(Number(value)), volumeLabel]}
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
          <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
