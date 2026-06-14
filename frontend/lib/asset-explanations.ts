import type { AssetDetail, HistoricalSignal, MarketSnapshot, Narrative, ReplayPoint, Signal } from "@/lib/api";
import {
  formatPercent,
  formatRelativeTime,
  formatVolume,
  narrativeTypeLabel,
  severityFromScore,
} from "@/lib/format";

export interface AssetExplanationLocale {
  t: (key: string, vars?: Record<string, string | number>) => string;
  signalLabel: (type: string | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
}

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
  hasHistoricalSignals: boolean;
  hasHistoricalOnly: boolean;
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
  signalExplanations: { signal: Signal; details: string[]; summary: string | null }[];
  chartMarkers: ChartSignalMarker[];
}

function topActiveSignal(signals: Signal[]): Signal | null {
  const active = signals.filter((s) => s.status === "active");
  if (active.length === 0) return null;
  return active.reduce((best, s) => (s.score > best.score ? s : best));
}

function historicalToSignal(h: HistoricalSignal): Signal {
  return {
    id: h.id,
    asset_id: 0,
    signal_type: h.signal_type,
    score: h.peak_score,
    severity: severityFromScore(h.peak_score),
    status: h.status,
    reason_json: h.reason_json ?? {},
    metric_snapshot_json: null,
    created_at: h.detected_at,
    updated_at: h.resolved_at ?? h.detected_at,
  };
}

function volumeRatioFromSignals(signals: Signal[]): number | null {
  for (const s of signals) {
    const ratio = s.reason_json?.volume_ratio;
    if (ratio != null) return Number(ratio);
  }
  return null;
}

function statusHeadline(score: number, hasActive: boolean, locale: AssetExplanationLocale): string {
  const { t } = locale;
  if (!hasActive) return t("asset.noActiveAnomaliesHeadline");
  if (score >= 80) return t("asset.statusCritical");
  if (score >= 60) return t("asset.statusSignificant");
  if (score >= 40) return t("asset.statusUnusual");
  return t("asset.statusWatch");
}

function asPercentValue(value: number): number {
  return Math.abs(value) < 2 ? value * 100 : value;
}

function buildSignalExplanationDetails(signal: Signal, locale: AssetExplanationLocale): string[] {
  const { t } = locale;
  const reason = signal.reason_json ?? {};

  switch (signal.signal_type) {
    case "price_shock": {
      const currentReturn = Number(reason.current_return ?? 0);
      const meanReturn = Number(reason.baseline_mean_return ?? 0);
      const stdReturn = Number(reason.baseline_std_return ?? 0);
      const z = Number(reason.price_z_score ?? 0);
      const threshold = Number(reason.threshold ?? 3);
      return [
        t("asset.explCurrentReturn", { value: formatPercent(asPercentValue(currentReturn)) }),
        t("asset.explBaselineMeanReturn", { value: formatPercent(asPercentValue(meanReturn)) }),
        t("asset.explBaselineStd", { value: `${asPercentValue(stdReturn).toFixed(4)}%` }),
        t("asset.explZScore", { value: z.toFixed(2) }),
        t("asset.explThreshold", { value: String(threshold) }),
      ];
    }
    case "volume_shock": {
      const currentVol = reason.current_volume_24h;
      const baselineVol = reason.baseline_volume_24h;
      const ratio = Number(reason.volume_ratio ?? 0);
      const threshold = Number(reason.threshold ?? 3);
      return [
        t("asset.explVolumeRatio", { value: `${ratio.toFixed(2)}x` }),
        t("asset.explBaselineVolume", { value: formatVolume(baselineVol) }),
        t("asset.explCurrentVolume", { value: formatVolume(currentVol) }),
        t("asset.explVolumeThreshold", { value: `${threshold}x` }),
      ];
    }
    case "quiet_accumulation": {
      const ratio = Number(reason.volume_ratio ?? 0);
      const pct = Number(reason.percent_change_24h ?? 0);
      const volumeThreshold = Number(reason.volume_threshold ?? 3);
      const flatThreshold = Number(reason.price_flat_threshold ?? 2);
      return [
        t("asset.explVolumeRatio", { value: `${ratio.toFixed(2)}x` }),
        t("asset.expl24hChange", { value: formatPercent(pct), flat: flatThreshold }),
        t("asset.explQuietCondition"),
        t("asset.explCurrentVolume", { value: formatVolume(reason.current_volume_24h) }),
        t("asset.explBaselineVolume", { value: formatVolume(reason.baseline_volume_24h) }),
        t("asset.explVolumeThreshold", { value: `${volumeThreshold}x` }),
      ];
    }
    default:
      return [t("asset.explInsufficientData")];
  }
}

function buildSignalSummary(signal: Signal, locale: AssetExplanationLocale): string | null {
  const { t } = locale;
  const reason = signal.reason_json ?? {};

  switch (signal.signal_type) {
    case "volume_shock": {
      const ratio = Number(reason.volume_ratio ?? 0);
      if (ratio <= 0) return null;
      return t("asset.explVolumeTriggered", { ratio: `${ratio.toFixed(2)}x` });
    }
    case "price_shock": {
      const z = Number(reason.price_z_score ?? 0);
      const threshold = Number(reason.threshold ?? 3);
      return t("asset.explPriceTriggered", { z: z.toFixed(2), threshold: String(threshold) });
    }
    case "quiet_accumulation": {
      const ratio = Number(reason.volume_ratio ?? 0);
      const flatThreshold = Number(reason.price_flat_threshold ?? 2);
      return t("asset.explQuietTriggered", {
        ratio: `${ratio.toFixed(2)}x`,
        flat: flatThreshold,
      });
    }
    default:
      return null;
  }
}

function referenceHistoricalSignal(detail: AssetDetail): Signal | null {
  const historical = detail.historical_signals ?? [];
  if (historical.length > 0) {
    return historicalToSignal(historical[0]);
  }
  return detail.signal_timeline[0] ?? null;
}

function buildWhyFlagged(
  signal: Signal | null,
  hasActive: boolean,
  hasHistorical: boolean,
  locale: AssetExplanationLocale
): string[] {
  const { t, signalLabel } = locale;

  if (hasActive && signal) {
    return [
      t("asset.whyActiveIntro", { signal: signalLabel(signal.signal_type) }),
      ...buildSignalExplanationDetails(signal, locale),
    ];
  }

  if (hasHistorical && signal) {
    return [
      t("asset.whyHistoricalIntro", { signal: signalLabel(signal.signal_type) }),
      ...buildSignalExplanationDetails(signal, locale),
    ];
  }

  return [t("asset.whyNoActive"), t("asset.whyWithinBaseline")];
}

function buildEnhancedNarrative(
  narrative: Narrative,
  signals: Signal[],
  hasActive: boolean,
  hasHistorical: boolean,
  locale: AssetExplanationLocale
): { title: string; paragraphs: string[] } {
  const { t } = locale;
  const activeTypes = new Set(signals.filter((s) => s.status === "active").map((s) => s.signal_type));
  const hasVolume = activeTypes.has("volume_shock") || activeTypes.has("quiet_accumulation");
  const hasPrice = activeTypes.has("price_shock");

  switch (narrative.type) {
    case "VOLATILITY_EVENT":
      return {
        title: t("asset.narrativeVolatilityTitle"),
        paragraphs: [
          "Radar detected an unusually large price movement relative to the recent baseline.",
          hasVolume
            ? "Price behavior became statistically abnormal with some volume confirmation."
            : "Price behavior became statistically abnormal while volume remained close to normal levels.",
        ],
      };
    case "ACCUMULATION":
      return {
        title: t("asset.narrativeAccumulationTitle"),
        paragraphs: [
          "Radar detected elevated trading volume with relatively stable price action.",
          "Volume is running well above baseline while price has not yet moved proportionally.",
        ],
      };
    case "MOMENTUM_EXPANSION":
      return {
        title: t("asset.narrativeMomentumTitle"),
        paragraphs: [
          "Radar detected simultaneous volume and price anomalies.",
          "Both participation and price movement are outside normal baseline ranges.",
        ],
      };
    case "VOLUME_ANOMALY":
      return {
        title: t("asset.narrativeVolumeTitle"),
        paragraphs: [
          "Radar detected a significant volume surge relative to the recent baseline.",
          "Trading participation increased without a matching price shock signal.",
        ],
      };
    case "MIXED_SIGNAL":
      return {
        title: t("asset.narrativeMixedTitle"),
        paragraphs: [
          "Radar detected multiple overlapping anomaly patterns on this asset.",
          "Review individual signal explanations below for the complete picture.",
        ],
      };
    case "NORMAL":
    default:
      if (hasActive) {
        return { title: narrativeTypeLabel(narrative.type), paragraphs: [narrative.description] };
      }
      if (hasHistorical) {
        return {
          title: t("asset.normalMarketConditions"),
          paragraphs: [
            t("asset.narrativeNormalHistorical1"),
            t("asset.narrativeNormalHistorical2"),
          ],
        };
      }
      return {
        title: t("asset.normalMarketConditions"),
        paragraphs: [
          t("asset.narrativeNormalNoActive1"),
          t("asset.narrativeNormalNoActive2"),
        ],
      };
  }
}

function buildKeyFindings(
  detail: AssetDetail,
  hasActive: boolean,
  hasHistorical: boolean,
  topSignal: Signal | null,
  locale: AssetExplanationLocale
): string[] {
  const { t } = locale;
  const findings: string[] = [];

  if (hasActive && topSignal) {
    switch (topSignal.signal_type) {
      case "price_shock":
        findings.push(t("asset.findingPriceBaseline"));
        findings.push(t("asset.findingPriceThreshold"));
        break;
      case "volume_shock":
        findings.push(t("asset.findingVolumeBaseline"));
        findings.push(t("asset.findingVolumeThreshold"));
        break;
      case "quiet_accumulation":
        findings.push(t("asset.findingQuietPattern"));
        findings.push(t("asset.findingQuietDetected"));
        break;
    }
    if (detail.anomaly_score > 0) {
      findings.push(t("asset.findingCompositeScore", { score: detail.anomaly_score }));
    }
    if (detail.narrative.type !== "NORMAL") {
      findings.push(t("asset.findingNarrative", { narrative: narrativeTypeLabel(detail.narrative.type) }));
    }
    findings.push(t("asset.findingActive"));
  } else if (hasHistorical) {
    findings.push(t("asset.findingNoActive"));
    findings.push(t("asset.findingResolved"));
  } else {
    findings.push(t("asset.findingNoActive"));
    findings.push(t("asset.findingNoHistory"));
  }

  return findings;
}

function buildWhatChanged(
  detail: AssetDetail,
  snapshots: MarketSnapshot[],
  replayPoints: ReplayPoint[],
  prevVolumeRatio: number | null,
  currVolumeRatio: number | null,
  locale: AssetExplanationLocale
): WhatChangedRow[] {
  const { t } = locale;
  const rows: WhatChangedRow[] = [];
  const latest = snapshots.at(-1);
  const previous = snapshots.at(-2);

  const prevReplay = replayPoints.length >= 2 ? replayPoints[replayPoints.length - 2] : null;
  const prevScore = prevReplay?.anomaly_score ?? 0;
  const currScore = detail.anomaly_score;

  if (prevScore !== currScore || currScore > 0) {
    rows.push({
      label: t("asset.radarScore"),
      before: prevScore > 0 ? String(prevScore) : "0",
      after: currScore > 0 ? String(currScore) : "0",
    });
  }

  const prevPct = previous?.percent_change_24h ?? null;
  const currPct = latest?.percent_change_24h;
  if (previous && latest && prevPct != null && currPct != null) {
    rows.push({
      label: t("common.change24h"),
      before: formatPercent(prevPct),
      after: formatPercent(currPct),
    });
  }

  if (prevVolumeRatio != null || currVolumeRatio != null) {
    rows.push({
      label: t("radar.volumeRatio"),
      before: prevVolumeRatio != null ? `${prevVolumeRatio.toFixed(1)}x` : "1.0x",
      after: currVolumeRatio != null ? `${currVolumeRatio.toFixed(1)}x` : "1.0x",
    });
  }

  const prevNarrative = prevReplay?.narrative?.type ?? "NORMAL";
  const currNarrative = detail.narrative.type;
  if (prevNarrative !== currNarrative || currNarrative !== "NORMAL") {
    rows.push({
      label: t("asset.marketNarrative"),
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
  snapshots: MarketSnapshot[],
  signalLabel: (type: string) => string,
  formatDate: (value: string | null | undefined) => string
): ChartSignalMarker[] {
  if (snapshots.length === 0 || signals.length === 0) return [];

  const chronSnaps = snapshots;
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
        label: signalLabel(signal.signal_type),
        color: MARKER_COLORS[signal.signal_type] ?? "#94a3b8",
      };
    });
}

export function buildAssetExplanationContext(
  detail: AssetDetail,
  snapshots: MarketSnapshot[],
  replayPoints: ReplayPoint[],
  locale: AssetExplanationLocale
): AssetExplanationContext {
  const { t, signalLabel, formatDate } = locale;
  const topSignal = topActiveSignal(detail.recent_signals);
  const historical = detail.historical_signals ?? [];
  const hasHistoricalSignals = historical.length > 0 || detail.signal_timeline.length > 0;
  const hasActiveAnomaly =
    detail.anomaly_score > 0 && detail.recent_signals.some((s) => s.status === "active");
  const hasHistoricalOnly = !hasActiveAnomaly && hasHistoricalSignals;

  const referenceSignal = hasActiveAnomaly
    ? topSignal
    : referenceHistoricalSignal(detail);

  const lastTimelineSignal = historical[0]
    ? historicalToSignal(historical[0])
    : detail.signal_timeline[0] ?? null;

  const peakScore = Math.max(
    detail.anomaly_score,
    ...historical.map((s) => s.peak_score),
    ...detail.signal_timeline.map((s) => s.score),
    0
  );

  const currVolumeRatio = volumeRatioFromSignals(detail.recent_signals);
  const prevVolumeRatio =
    replayPoints.length >= 2
      ? volumeRatioFromSignals(replayPoints[replayPoints.length - 2].signals)
      : null;

  const explanationSignals: Signal[] = hasActiveAnomaly
    ? detail.recent_signals
    : historical.length > 0
      ? historical.map(historicalToSignal)
      : detail.signal_timeline;

  return {
    hasActiveAnomaly,
    hasHistoricalSignals,
    hasHistoricalOnly,
    statusHeadline: statusHeadline(detail.anomaly_score, hasActiveAnomaly, locale),
    statusSubtext: hasActiveAnomaly
      ? t("asset.statusSubtextActive")
      : hasHistoricalOnly
        ? t("asset.historicalActivityHint")
        : t("asset.statusSubtextFaded"),
    activeSignalLabel: topSignal ? signalLabel(topSignal.signal_type) : null,
    detectedAt: topSignal ? formatRelativeTime(topSignal.created_at) : null,
    lastSignalLabel: lastTimelineSignal ? signalLabel(lastTimelineSignal.signal_type) : null,
    peakScore,
    whyFlaggedParagraphs: buildWhyFlagged(
      referenceSignal,
      hasActiveAnomaly,
      hasHistoricalSignals,
      locale
    ),
    keyFindings: buildKeyFindings(
      detail,
      hasActiveAnomaly,
      hasHistoricalSignals,
      topSignal,
      locale
    ),
    whatChanged: buildWhatChanged(
      detail,
      snapshots,
      replayPoints,
      prevVolumeRatio,
      currVolumeRatio,
      locale
    ),
    enhancedNarrative: buildEnhancedNarrative(
      detail.narrative,
      detail.recent_signals,
      hasActiveAnomaly,
      hasHistoricalSignals,
      locale
    ),
    signalExplanations: explanationSignals.map((signal) => ({
      signal,
      details: buildSignalExplanationDetails(signal, locale),
      summary: buildSignalSummary(signal, locale),
    })),
    chartMarkers: buildChartMarkers(
      explanationSignals.length > 0 ? explanationSignals : detail.signal_timeline,
      snapshots,
      signalLabel,
      formatDate
    ),
  };
}

export function statusAccentClass(score: number, hasActive: boolean): string {
  if (!hasActive) return "border-radar-border bg-radar-elevated/40";
  const sev = score >= 80 ? "critical" : score >= 60 ? "significant" : score >= 40 ? "watch" : "normal";
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
