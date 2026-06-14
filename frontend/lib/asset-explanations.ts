import type { AssetDetail, MarketSnapshot, Narrative, ReplayPoint, Signal } from "@/lib/api";
import {
  formatPercent,
  formatRelativeTime,
  formatSignalType,
  formatDate,
  formatVolume,
  narrativeTypeLabel,
  severityFromScore,
} from "@/lib/format";

export interface WhatChangedRow {
  label: string;
  before: string;
  after: string;
}

export interface ChartSignalMarker {
  time: string;
  label: string;
  color: string;
}

export interface AssetExplanationContext {
  hasActiveAnomaly: boolean;
  statusHeadline: string;
  statusSubtext: string;
  activeSignalLabel: string | null;
  detectedAt: string | null;
  lastSignalLabel: string | null;
  peakScore: number;
  whyFlaggedParagraphs: string[];
  keyFindings: string[];
  whatChanged: WhatChangedRow[];
  enhancedNarrative: { title: string; paragraphs: string[] };
  signalExplanations: { signal: Signal; details: string[] }[];
  chartMarkers: ChartSignalMarker[];
}

function topActiveSignal(signals: Signal[]): Signal | null {
  const active = signals.filter((s) => s.status === "active");
  if (active.length === 0) return null;
  return active.reduce((best, s) => (s.score > best.score ? s : best));
}

function volumeRatioFromSignals(signals: Signal[]): number | null {
  for (const s of signals) {
    const ratio = s.reason_json?.volume_ratio;
    if (ratio != null) return Number(ratio);
  }
  return null;
}

function statusHeadline(score: number, hasActive: boolean): string {
  if (!hasActive) return "NO ACTIVE ANOMALIES";
  if (score >= 80) return "CRITICAL ANOMALY DETECTED";
  if (score >= 60) return "SIGNIFICANT ANOMALY DETECTED";
  if (score >= 40) return "UNUSUAL ACTIVITY DETECTED";
  return "WATCH LIST ACTIVITY";
}

function asPercentValue(value: number): number {
  return Math.abs(value) < 2 ? value * 100 : value;
}

function buildSignalExplanationDetails(signal: Signal): string[] {
  const reason = signal.reason_json ?? {};

  switch (signal.signal_type) {
    case "price_shock": {
      const currentReturn = Number(reason.current_return ?? 0);
      const meanReturn = Number(reason.baseline_mean_return ?? 0);
      const stdReturn = Number(reason.baseline_std_return ?? 0);
      const z = Number(reason.price_z_score ?? 0);
      const threshold = Number(reason.threshold ?? 3);
      return [
        `Current return: ${formatPercent(asPercentValue(currentReturn))}`,
        `Baseline mean return: ${formatPercent(asPercentValue(meanReturn))}`,
        `Baseline std: ${(asPercentValue(stdReturn)).toFixed(4)}%`,
        `Z-score: ${z.toFixed(2)}`,
        `Threshold: ${threshold}`,
      ];
    }
    case "volume_shock": {
      const currentVol = reason.current_volume_24h;
      const baselineVol = reason.baseline_volume_24h;
      const ratio = Number(reason.volume_ratio ?? 0);
      const threshold = Number(reason.threshold ?? 3);
      return [
        `Current volume: ${formatVolume(currentVol)}`,
        `Baseline volume: ${formatVolume(baselineVol)}`,
        `Volume ratio: ${ratio.toFixed(2)}x`,
        `Threshold: ${threshold}x`,
      ];
    }
    case "quiet_accumulation": {
      const ratio = Number(reason.volume_ratio ?? 0);
      const pct = Number(reason.percent_change_24h ?? 0);
      const volumeThreshold = Number(reason.volume_threshold ?? 3);
      const flatThreshold = Number(reason.price_flat_threshold ?? 2);
      return [
        `Volume ratio: ${ratio.toFixed(2)}x (threshold ${volumeThreshold}x)`,
        `24h change: ${formatPercent(pct)} (flat threshold ±${flatThreshold}%)`,
        `Condition: volume elevated while price remains flat`,
        `Current volume: ${formatVolume(reason.current_volume_24h)}`,
        `Baseline volume: ${formatVolume(reason.baseline_volume_24h)}`,
      ];
    }
    default:
      return ["Insufficient metric data for this signal type."];
  }
}

function buildWhyFlagged(signal: Signal | null, hasActive: boolean): string[] {
  if (!hasActive || !signal) {
    return [
      "Radar is not detecting unusual market behavior for this asset right now.",
      "Price, volume, and participation metrics are within expected baseline ranges.",
    ];
  }

  return [
    `${formatSignalType(signal.signal_type)} triggered based on measured market metrics:`,
    ...buildSignalExplanationDetails(signal),
  ];
}

function buildEnhancedNarrative(
  narrative: Narrative,
  signals: Signal[],
  hasActive: boolean
): { title: string; paragraphs: string[] } {
  const activeTypes = new Set(signals.filter((s) => s.status === "active").map((s) => s.signal_type));
  const hasVolume = activeTypes.has("volume_shock") || activeTypes.has("quiet_accumulation");
  const hasPrice = activeTypes.has("price_shock");

  switch (narrative.type) {
    case "VOLATILITY_EVENT":
      return {
        title: "Volatility Event",
        paragraphs: [
          "Radar detected an unusually large price movement relative to the recent baseline.",
          hasVolume
            ? "Price behavior became statistically abnormal with some volume confirmation."
            : "Price behavior became statistically abnormal while volume remained close to normal levels.",
          hasVolume
            ? "Both price action and market participation contributed to this anomaly."
            : "The anomaly is primarily driven by price action rather than market participation.",
        ],
      };
    case "ACCUMULATION":
      return {
        title: "Accumulation",
        paragraphs: [
          "Radar detected elevated trading volume with relatively stable price action.",
          "Volume is running well above baseline while price has not yet moved proportionally.",
          "This combination often reflects positioning activity before a broader market reaction.",
        ],
      };
    case "MOMENTUM_EXPANSION":
      return {
        title: "Momentum Expansion",
        paragraphs: [
          "Radar detected simultaneous volume and price anomalies.",
          "Both participation and price movement are outside normal baseline ranges.",
          "This pattern suggests momentum may be accelerating across the market.",
        ],
      };
    case "VOLUME_ANOMALY":
      return {
        title: "Volume Anomaly",
        paragraphs: [
          "Radar detected a significant volume surge relative to the recent baseline.",
          "Trading participation increased without a matching price shock signal.",
          "Elevated volume may indicate building interest before a larger price move.",
        ],
      };
    case "MIXED_SIGNAL":
      return {
        title: "Mixed Market Signals",
        paragraphs: [
          "Radar detected multiple overlapping anomaly patterns on this asset.",
          "No single signal type fully explains current market behavior.",
          "Review individual signal explanations below for the complete picture.",
        ],
      };
    case "NORMAL":
    default:
      return {
        title: hasActive ? narrativeTypeLabel(narrative.type) : "Normal Market Conditions",
        paragraphs: hasActive
          ? [narrative.description]
          : [
              "No significant anomalies are currently active for this asset.",
              "Market metrics remain within expected baseline ranges based on recent history.",
            ],
      };
  }
}

function buildKeyFindings(
  detail: AssetDetail,
  hasActive: boolean,
  topSignal: Signal | null
): string[] {
  const findings: string[] = [];

  if (hasActive && topSignal) {
    switch (topSignal.signal_type) {
      case "price_shock":
        findings.push("Price behavior exceeded historical baseline");
        findings.push("Price Shock threshold crossed");
        break;
      case "volume_shock":
        findings.push("Volume exceeded historical baseline");
        findings.push("Volume Shock threshold crossed");
        break;
      case "quiet_accumulation":
        findings.push("Volume rose without proportional price movement");
        findings.push("Quiet Accumulation pattern detected");
        break;
    }
    if (detail.anomaly_score > 0) {
      findings.push(`Composite score reached ${detail.anomaly_score}`);
    }
    if (detail.narrative.type !== "NORMAL") {
      findings.push(`Narrative classified as ${narrativeTypeLabel(detail.narrative.type)}`);
    }
    findings.push("Signal currently active");
  } else {
    findings.push("No active anomaly signals");
    if (detail.signal_timeline.length > 0) {
      findings.push("Previous signal has faded from active state");
    } else {
      findings.push("No recent anomaly history on record");
    }
    findings.push("Signal no longer active");
  }

  return findings;
}

function buildWhatChanged(
  detail: AssetDetail,
  snapshots: MarketSnapshot[],
  replayPoints: ReplayPoint[],
  prevVolumeRatio: number | null,
  currVolumeRatio: number | null
): WhatChangedRow[] {
  const rows: WhatChangedRow[] = [];
  const latest = snapshots[0];
  const previous = snapshots[1];

  const prevReplay =
    replayPoints.length >= 2 ? replayPoints[replayPoints.length - 2] : null;
  const currReplay =
    replayPoints.length >= 1 ? replayPoints[replayPoints.length - 1] : null;

  const prevScore = prevReplay?.anomaly_score ?? 0;
  const currScore = detail.anomaly_score;

  if (prevScore !== currScore || currScore > 0) {
    rows.push({
      label: "Score",
      before: prevScore > 0 ? String(prevScore) : "0",
      after: currScore > 0 ? String(currScore) : "0",
    });
  }

  const prevPct = previous?.percent_change_24h ?? null;
  const currPct = latest?.percent_change_24h;
  if (previous && latest && prevPct != null && currPct != null) {
    rows.push({
      label: "Price (24h)",
      before: formatPercent(prevPct),
      after: formatPercent(currPct),
    });
  }

  if (prevVolumeRatio != null || currVolumeRatio != null) {
    rows.push({
      label: "Volume Ratio",
      before: prevVolumeRatio != null ? `${prevVolumeRatio.toFixed(1)}x` : "1.0x",
      after: currVolumeRatio != null ? `${currVolumeRatio.toFixed(1)}x` : "1.0x",
    });
  }

  const prevNarrative = prevReplay?.narrative?.type ?? "NORMAL";
  const currNarrative = detail.narrative.type;
  if (prevNarrative !== currNarrative || currNarrative !== "NORMAL") {
    rows.push({
      label: "Narrative",
      before: narrativeTypeLabel(prevNarrative),
      after: narrativeTypeLabel(currNarrative),
    });
  }

  return rows;
}

const MARKER_COLORS: Record<string, string> = {
  price_shock: "#ef4444",
  volume_shock: "#f59e0b",
  quiet_accumulation: "#3b82f6",
};

export function buildChartMarkers(
  signals: Signal[],
  snapshots: MarketSnapshot[]
): ChartSignalMarker[] {
  if (snapshots.length === 0 || signals.length === 0) return [];

  const chronSnaps = [...snapshots].reverse();
  const seen = new Set<string>();

  return signals
    .slice()
    .reverse()
    .filter((s) => {
      if (seen.has(s.signal_type)) return false;
      seen.add(s.signal_type);
      return true;
    })
    .map((signal) => {
      const sigTime = new Date(signal.created_at).getTime();
      let closest = chronSnaps[0];
      let minDiff = Infinity;
      for (const snap of chronSnaps) {
        const diff = Math.abs(new Date(snap.captured_at).getTime() - sigTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = snap;
        }
      }
      return {
        time: formatDate(closest.captured_at),
        label: formatSignalType(signal.signal_type),
        color: MARKER_COLORS[signal.signal_type] ?? "#94a3b8",
      };
    });
}

export function buildAssetExplanationContext(
  detail: AssetDetail,
  snapshots: MarketSnapshot[],
  replayPoints: ReplayPoint[]
): AssetExplanationContext {
  const topSignal = topActiveSignal(detail.recent_signals);
  const hasActiveAnomaly =
    detail.anomaly_score > 0 &&
    detail.recent_signals.some((s) => s.status === "active");
  const lastTimelineSignal = detail.signal_timeline[0] ?? null;
  const peakScore = Math.max(
    detail.anomaly_score,
    ...detail.signal_timeline.map((s) => s.score),
    0
  );

  const currVolumeRatio = volumeRatioFromSignals(detail.recent_signals);
  const prevVolumeRatio =
    replayPoints.length >= 2
      ? volumeRatioFromSignals(replayPoints[replayPoints.length - 2].signals)
      : null;

  return {
    hasActiveAnomaly,
    statusHeadline: statusHeadline(detail.anomaly_score, hasActiveAnomaly),
    statusSubtext: hasActiveAnomaly
      ? "Radar currently detects unusual market behavior."
      : "Previous anomaly has faded.",
    activeSignalLabel: topSignal ? formatSignalType(topSignal.signal_type) : null,
    detectedAt: topSignal ? formatRelativeTime(topSignal.created_at) : null,
    lastSignalLabel: lastTimelineSignal
      ? formatSignalType(lastTimelineSignal.signal_type)
      : null,
    peakScore,
    whyFlaggedParagraphs: buildWhyFlagged(topSignal, hasActiveAnomaly),
    keyFindings: buildKeyFindings(detail, hasActiveAnomaly, topSignal),
    whatChanged: buildWhatChanged(
      detail,
      snapshots,
      replayPoints,
      prevVolumeRatio,
      currVolumeRatio
    ),
    enhancedNarrative: buildEnhancedNarrative(
      detail.narrative,
      detail.recent_signals,
      hasActiveAnomaly
    ),
    signalExplanations: (hasActiveAnomaly ? detail.recent_signals : detail.signal_timeline.slice(0, 3)).map(
      (signal) => ({
        signal,
        details: buildSignalExplanationDetails(signal),
      })
    ),
    chartMarkers: buildChartMarkers(detail.signal_timeline, snapshots),
  };
}

export function statusAccentClass(score: number, hasActive: boolean): string {
  if (!hasActive) return "border-radar-border bg-radar-elevated/40";
  const sev = severityFromScore(score);
  switch (sev) {
    case "critical":
      return "border-terminal-red/40 bg-terminal-red/5";
    case "significant":
      return "border-terminal-amber/40 bg-terminal-amber/5";
    case "watch":
      return "border-terminal-blue/40 bg-terminal-blue/5";
    default:
      return "border-radar-border bg-radar-elevated/40";
  }
}
