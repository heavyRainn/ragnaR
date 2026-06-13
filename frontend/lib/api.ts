export interface Narrative {
  type: string;
  title: string;
  description: string;
}

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  slug: string | null;
  rank: number | null;
  category: string | null;
  is_active: boolean;
}

export interface MarketSnapshot {
  id: number;
  asset_id: number;
  price: string;
  volume_24h: string;
  market_cap: string | null;
  percent_change_1h: string | null;
  percent_change_24h: string | null;
  percent_change_7d: string | null;
  captured_at: string;
}

export interface Signal {
  id: number;
  asset_id: number;
  signal_type: string;
  score: number;
  severity: string;
  status: string;
  reason_json: Record<string, number>;
  metric_snapshot_json: Record<string, number | null> | null;
  created_at: string;
  asset_symbol?: string | null;
  asset_name?: string | null;
  feed_description?: string | null;
}

export interface ScoreBreakdown {
  total_score: number;
  components: {
    volume: number;
    price: number;
    quiet_accumulation: number;
  };
}

export interface RadarItem {
  asset: Asset;
  price: string | null;
  volume_24h: string | null;
  market_cap: string | null;
  percent_change_24h: string | null;
  anomaly_score: number;
  severity: string;
  main_signal: string | null;
  volume_ratio: number | null;
  narrative?: Narrative | null;
}

export interface AssetDetail {
  asset: Asset;
  latest_snapshot: MarketSnapshot | null;
  recent_signals: Signal[];
  signal_timeline: Signal[];
  anomaly_score: number;
  score_breakdown: ScoreBreakdown;
  narrative: Narrative;
}

export interface ReplayPoint {
  timestamp: string;
  price: string;
  volume_24h: string;
  anomaly_score: number;
  signals: Signal[];
  narrative: Narrative;
}

export interface SystemStatus {
  data_source: "live" | "mock";
  cmc_api_configured: boolean;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  getSystemStatus: () => fetchApi<SystemStatus>("/api/system/status"),
  getRadar: () => fetchApi<RadarItem[]>("/api/radar"),
  getAssets: () => fetchApi<Asset[]>("/api/assets"),
  getAsset: (symbol: string) => fetchApi<AssetDetail>(`/api/assets/${symbol}`),
  getSnapshots: (symbol: string) => fetchApi<MarketSnapshot[]>(`/api/assets/${symbol}/snapshots`),
  getSignals: () => fetchApi<Signal[]>("/api/signals"),
  getReplay: (symbol: string) => fetchApi<ReplayPoint[]>(`/api/replay/${symbol}`),
};
