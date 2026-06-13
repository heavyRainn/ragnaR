# Crypto Market Intelligence Radar

Minimal full-stack MVP for explainable crypto market anomaly detection.

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy 2, Pydantic v2, Alembic, PostgreSQL, Uvicorn
- **Frontend:** Next.js, TypeScript, Tailwind CSS, Recharts
- **Infrastructure:** Docker Compose

## Data Source Modes

The app supports two explicit data modes. Check `/api/system/status` or the badge on `/radar` to see which mode is active.

### Mock mode (default)

No CoinMarketCap API key required. Uses seeded snapshots for local development.

```bash
docker compose up --build
```

Dashboard badge: `MOCK DATA · Seeded snapshots`

### Live mode

Add your CoinMarketCap API key to `.env`:

```env
CMC_API_KEY=your_coinmarketcap_api_key
```

Get a free key at: https://coinmarketcap.com/api/

After changing `.env`, restart:

```bash
docker compose down
docker compose up --build
```

To fully reset the database and remove old seed data:

```bash
docker compose down -v
docker compose up --build
```

Dashboard badge: `LIVE DATA · CoinMarketCap`

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start all services (mock mode works out of the box):

```bash
docker compose up --build
```

3. Open the frontend:

- Landing: http://localhost:3000
- Market Radar: http://localhost:3000/radar
- Asset detail example: http://localhost:3000/assets/BTC

4. Open backend API docs:

- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/system/status` | Data source mode (live / mock) |
| GET | `/health` | Health check |
| GET | `/api/assets` | List all assets |
| GET | `/api/assets/{symbol}` | Asset detail with latest snapshot and signals |
| GET | `/api/assets/{symbol}/snapshots` | Time-series snapshots |
| GET | `/api/signals` | Latest active signals |
| GET | `/api/replay/{symbol}` | Historical replay of scores and signals |
| GET | `/api/radar` | Assets ranked by composite anomaly score |

## Signal Logic

### Volume Shock

Triggered when `volume_ratio >= 3.0`:

```
volume_ratio = current_volume_24h / average_volume_24h_baseline
score = min(100, int(volume_ratio / 10 * 100))
```

### Price Shock

Triggered when `abs(price_z_score) >= 2.0`:

```
price_z_score = (current_return_24h - mean_return_baseline) / std_return_baseline
score = min(100, int(abs(price_z_score) / 5 * 100))
```

### Quiet Accumulation

Triggered when volume spikes but price stays flat:

```
volume_ratio >= 3.0 AND abs(percent_change_24h) <= 2.0
score = min(100, int(volume_ratio * 15 + max(0, 20 - abs(percent_change_24h) * 5)))
```

### Composite Anomaly Score

Weighted aggregation of active signal scores (weights normalized when a signal type is absent):

```
composite = 0.40 * volume + 0.35 * price + 0.25 * quiet_accumulation
```

Dashboard sorting uses **composite score**. **Main Signal** is the highest-scoring individual active signal.

## Project Structure

```
crypto-market-intelligence-radar/
├── backend/          # FastAPI application
├── frontend/         # Next.js dashboard
├── docker-compose.yml
├── .env.example
└── README.md
```

## Seed Data

On first startup, the backend seeds 10 crypto assets (BTC, ETH, SOL, XRP, DOGE, LINK, AVAX, TON, ADA, NEAR) with historical snapshots. Several assets have elevated volume ratios to demonstrate Volume Shock signals on the dashboard.

## Market Data (CoinMarketCap)

In **live mode**, the backend syncs quotes from CoinMarketCap every ~55 seconds:

- `price`, `volume_24h`, `market_cap`
- `percent_change_24h` (and 1h / 7d)
- `cmc_rank`

In **mock mode**, the same fields come from seeded snapshots in PostgreSQL.

## Next Steps (not implemented)

- CoinMarketCap API integration ✅ (basic quotes sync)
- OpenAI explanations
- WebSocket real-time updates
- Authentication
- Celery / Redis background jobs
