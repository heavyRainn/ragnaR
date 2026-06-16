import { en } from "./en";
import type { Messages } from "./types";
import { translate } from "./translate";

function localizedSectorName(messages: Messages, sector: string): string {
  if (sector in en.sectors) {
    return messages.sectors[sector as keyof Messages["sectors"]];
  }
  return sector;
}

function localizedNarrativeLabel(messages: Messages, enLabel: string): string {
  for (const sector of Object.keys(en.sectorNarrativeLabels) as Array<
    keyof Messages["sectorNarrativeLabels"]
  >) {
    if (en.sectorNarrativeLabels[sector] === enLabel) {
      return messages.sectorNarrativeLabels[sector];
    }
  }
  return enLabel;
}

/** Translate rule-based market narrative strings from the backend. */
export function translateMarketNarrative(messages: Messages, text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const exact: Record<string, keyof Messages["marketNarratives"]> = {
    "No significant market-wide anomalies detected.": "quiet",
    "Speculative activity increasing in meme assets.": "memeSpeculative",
    "Market attention remains broadly distributed.": "distributed",
    "Capital rotating into AI infrastructure assets.": "capitalIntoAi",
  };

  if (exact[trimmed]) {
    return translate(messages, `marketNarratives.${exact[trimmed]}`);
  }

  const capitalMatch = trimmed.match(/^Capital rotating into (.+)\.$/);
  if (capitalMatch) {
    return translate(messages, "marketNarratives.capitalIntoLabel", {
      label: localizedNarrativeLabel(messages, capitalMatch[1]),
    });
  }

  const elevatedMatch = trimmed.match(/^Elevated signal activity in (.+) while (.+) lags\.$/);
  if (elevatedMatch) {
    return translate(messages, "marketNarratives.elevatedWhileLags", {
      active: localizedNarrativeLabel(messages, elevatedMatch[1]),
      lagging: localizedNarrativeLabel(messages, elevatedMatch[2]),
    });
  }

  const concentratedMatch = trimmed.match(
    /^Radar attention concentrated in (.+); (.+) sector shows weaker anomaly scores\.$/
  );
  if (concentratedMatch) {
    return translate(messages, "marketNarratives.concentratedWeak", {
      leader: localizedNarrativeLabel(messages, concentratedMatch[1]),
      laggard: localizedSectorName(messages, concentratedMatch[2]),
    });
  }

  const elevatedAcross = trimmed.match(/^Elevated signal activity across (.+)\.$/);
  if (elevatedAcross) {
    return translate(messages, "marketNarratives.elevatedAcross", {
      label: localizedNarrativeLabel(messages, elevatedAcross[1]),
    });
  }

  const strongConcentration = trimmed.match(/^(.+) showing strong anomaly concentration\.$/);
  if (strongConcentration) {
    return translate(messages, "marketNarratives.strongConcentration", {
      label: localizedNarrativeLabel(messages, strongConcentration[1]),
    });
  }

  const outperforming = trimmed.match(
    /^(.+) outperforming on 24h price action with rising radar attention\.$/
  );
  if (outperforming) {
    return translate(messages, "marketNarratives.outperforming", {
      label: localizedNarrativeLabel(messages, outperforming[1]),
    });
  }

  const noAnomalies = trimmed.match(/^No significant anomalies detected in (.+) right now\.$/);
  if (noAnomalies) {
    return translate(messages, "marketNarratives.noAnomalies", {
      label: localizedNarrativeLabel(messages, noAnomalies[1]),
    });
  }

  const moderate = trimmed.match(/^Market attention in (.+) remains moderate\.$/);
  if (moderate) {
    return translate(messages, "marketNarratives.moderate", {
      label: localizedNarrativeLabel(messages, moderate[1]),
    });
  }

  const surged = trimmed.match(/^(.+) sector score surged from ([\d.]+) to ([\d.]+)\.$/);
  if (surged) {
    return translate(messages, "marketNarratives.sectorSurged", {
      sector: localizedSectorName(messages, surged[1]),
      from: surged[2],
      to: surged[3],
    });
  }

  const cooled = trimmed.match(/^(.+) sector score cooled from ([\d.]+) to ([\d.]+)\.$/);
  if (cooled) {
    return translate(messages, "marketNarratives.sectorCooled", {
      sector: localizedSectorName(messages, cooled[1]),
      from: cooled[2],
      to: cooled[3],
    });
  }

  const emerged = trimmed.match(/^(.+) emerged as the leading sector \(replacing (.+)\)\.$/);
  if (emerged) {
    return translate(messages, "marketNarratives.emergedLeader", {
      sector: localizedSectorName(messages, emerged[1]),
      previous: localizedSectorName(messages, emerged[2]),
    });
  }

  const activeLatest = trimmed.match(
    /^Active signals detected in (.+) — latest sector score ([\d.]+)\.$/
  );
  if (activeLatest) {
    return translate(messages, "marketNarratives.activeLatest", {
      sector: localizedSectorName(messages, activeLatest[1]),
      score: activeLatest[2],
    });
  }

  const tracking = trimmed.match(/^(.+) sector score tracking at ([\d.]+)\.$/);
  if (tracking) {
    return translate(messages, "marketNarratives.trackingAt", {
      sector: localizedSectorName(messages, tracking[1]),
      score: tracking[2],
    });
  }

  const noReplay = trimmed.match(/^No replay history available for (.+) sector yet\.$/);
  if (noReplay) {
    return translate(messages, "marketNarratives.noReplayHistory", {
      sector: localizedSectorName(messages, noReplay[1]),
    });
  }

  return text;
}
