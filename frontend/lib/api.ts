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
  volume_1m: string | null;
  volume_source: string | null;
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
  updated_at: string;
  asset_symbol?: string | null;
  asset_name?: string | null;
  feed_description?: string | null;
}

export interface HistoricalSignal {
  id: number;
  signal_type: string;
  detected_at: string;
  resolved_at: string | null;
  peak_score: number;
  outcome_percent: number | null;
  duration_seconds: number;
  status: string;
  reason_json: Record<string, number> | null;
}

export interface SignalOutcome {
  signal_type: string;
  detected_at: string;
  signal_score: number;
  current_status: string;
  price_at_signal: string;
  current_price: string;
  move_after_signal_percent: number;
  best_price_after_signal: string;
  worst_price_after_signal: string;
  max_move_after_signal: number;
  worst_move_after_signal: number;
  outcome: "Positive" | "Negative" | "Neutral";
}

export interface ReplayQuickIndices {
  before_signal: number | null;
  signal_detected: number | null;
  current_state: number | null;
}

export interface ScoreBreakdown {
  total_score: number;
  components: Record<string, number>;
}

export interface RadarItem {
  asset: Asset;
  price: string | null;
  volume_24h: string | null;
  market_cap: string | null;
  percent_change_1h: string | null;
  percent_change_24h: string | null;
  anomaly_score: number;
  severity: string;
  main_signal: string | null;
  volume_ratio: number | null;
  narrative?: Narrative | null;
  move_after_signal_percent?: number | null;
}

export interface AssetDetail {
  asset: Asset;
  latest_snapshot: MarketSnapshot | null;
  recent_signals: Signal[];
  signal_timeline: Signal[];
  anomaly_score: number;
  score_breakdown: ScoreBreakdown;
  narrative: Narrative;
  snapshot_count: number;
  required_snapshot_count: number;
  signal_outcome: SignalOutcome | null;
  historical_signals: HistoricalSignal[];
}

export interface ReplayResponse {
  symbol: string;
  points: ReplayPoint[];
  snapshot_count: number;
  required_snapshot_count: number;
  quick_indices: ReplayQuickIndices | null;
}

export interface ReplayPoint {
  timestamp: string;
  price: string;
  volume_24h: string;
  volume_1m: string | null;
  volume_source: string | null;
  market_cap: string | null;
  anomaly_score: number;
  signals: Signal[];
  narrative: Narrative;
}

export interface SystemStatus {
  data_source: "live" | "mock";
  cmc_api_configured: boolean;
  cmc_listings_limit: number | null;
  sync_interval_seconds: number;
  last_market_sync_at: string | null;
  last_sync_started_at: string | null;
  last_sync_finished_at: string | null;
  last_sync_status: "idle" | "running" | "success" | "failed" | "skipped";
  last_sync_error: string | null;
  last_successful_sync_at: string | null;
  last_cmc_assets_count: number;
  last_snapshots_inserted: number;
  last_signals_refreshed: number;
  next_sync_in_seconds: number;
  scheduler_running: boolean;
  message: string;
}

export interface SectorRotation {
  sector: string;
  average_radar_score: number;
  average_24h_change: number;
  active_signals_count: number;
  assets_count: number;
}

export interface MarketRotation {
  leader_sector: string | null;
  lagging_sector: string | null;
  most_active_sector: string | null;
  market_narrative: string;
  sectors: SectorRotation[];
}

export interface RecentMarketEvent {
  asset_symbol: string;
  asset_name: string;
  signal_type: string;
  peak_score: number;
  status: string;
  detected_at: string;
  move_after_signal_percent: number | null;
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
  getRecentMarketEvents: () => fetchApi<RecentMarketEvent[]>("/api/signals/recent"),
  getMarketRotation: () => fetchApi<MarketRotation>("/api/market-rotation"),
  getReplayDefaultSymbol: () => fetchApi<{ symbol: string }>("/api/replay/default-symbol"),
  getReplay: (symbol: string, signalId?: number) =>
    fetchApi<ReplayResponse>(
      signalId != null
        ? `/api/replay/${symbol}?signal_id=${signalId}`
        : `/api/replay/${symbol}`
    ),
};
