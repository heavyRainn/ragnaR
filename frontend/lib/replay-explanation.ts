import type { ReplayPoint } from "@/lib/api";
import { formatSignalType } from "@/lib/format";

export function buildWhatRadarSaw(
  current: ReplayPoint,
  previous: ReplayPoint | null
): string[] {
  const lines: string[] = [];
  const prevScore = previous?.anomaly_score ?? 0;
  const currScore = current.anomaly_score;

  if (current.signals.length === 0) {
    if (currScore > 0) {
      lines.push("Radar score elevated at this snapshot.");
      lines.push(`Radar Score is ${currScore}.`);
    } else {
      lines.push("No anomaly signals at this snapshot.");
      lines.push("Market metrics remained within expected baseline ranges.");
    }
    if (previous && prevScore !== currScore) {
      lines.push(`Radar Score changed from ${prevScore} to ${currScore}.`);
    }
    return lines;
  }

  for (const signal of current.signals) {
    lines.push(`${formatSignalType(signal.signal_type)} detected.`);

    const reason = signal.reason_json ?? {};
    switch (signal.signal_type) {
      case "price_shock":
        lines.push("Current return exceeded the historical baseline.");
        if (reason.price_z_score != null) {
          lines.push(`Z-score reached ${Number(reason.price_z_score).toFixed(1)}.`);
        }
        break;
      case "volume_shock":
        lines.push("Trading volume exceeded the recent baseline.");
        if (reason.volume_ratio != null) {
          lines.push(`Volume reached ${Number(reason.volume_ratio).toFixed(1)}x baseline.`);
        }
        break;
      case "quiet_accumulation":
        lines.push("Volume rose while price remained relatively stable.");
        if (reason.volume_ratio != null) {
          lines.push(`Volume reached ${Number(reason.volume_ratio).toFixed(1)}x baseline.`);
        }
        break;
      default:
        lines.push("Market behavior deviated from the expected baseline.");
    }
  }

  if (prevScore !== currScore) {
    if (currScore > prevScore) {
      lines.push(`Radar Score increased from ${prevScore} to ${currScore}.`);
    } else {
      lines.push(`Radar Score decreased from ${prevScore} to ${currScore}.`);
    }
  } else if (currScore > 0) {
    lines.push(`Radar Score is ${currScore}.`);
  }

  return lines;
}
