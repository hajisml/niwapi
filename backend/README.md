# NiWapi Backend

FastAPI service for report intake, blockage classification, risk scoring, sensor telemetry, and work-order dispatch.

## Run

```bash
docker compose up -d db     # from the repo root: local Postgres+PostGIS
uv sync
uv run python init_db.py    # idempotent: creates the postgis extension + schema
uv run python seed.py       # optional: demo reports/sensors across Kisumu hotspots
uv run uvicorn main:app --reload
```

API docs at `http://localhost:8000/docs`.

## Environment variables

Read from a `.env` file at the **repo root** (see `../.env.example`).

| Variable | Required | Effect when unset |
| --- | --- | --- |
| `DATABASE_URL` | Yes | N/A — defaults to the docker-compose Postgres in `.env.example` |
| `SUPABASE_URL` / `SUPABASE_KEY` | No | Report photos are stored on local disk (`backend/media/`, served at `/media`) instead of Supabase Storage |
| `GEMINI_API_KEY` | No | Blockage classification uses a deterministic mock (stable per photo, varies across photos) instead of real Gemini Vision |

`DATABASE_URL` works identically whether it points at the local docker container or a real Supabase Postgres connection string — DB access always goes through plain `psycopg2`, never the Supabase client.

## Endpoints

- `GET /`, `GET /health` — root + health (health includes a DB connectivity check).
- `POST /reports` — multipart (`photo`, `latitude`, `longitude`, `details`, optional `culvert_importance`). Runs classification → rainfall forecast → risk scoring → storage → insert, returns the full report.
- `GET /reports`, `GET /reports/{id}` — list (ranked by risk) / detail.
- `GET /sensors` — latest reading per sensor.
- `POST /sensors/telemetry` — ingest one reading (`label`, `latitude`, `longitude`, `clearance_distance`); upserts by `label`.
- `POST /work-orders` (`report_id`, `assigned_team`) — dispatch; sets the report to `dispatched`.
- `GET /work-orders` — list.
- `PATCH /work-orders/{id}/resolve` — optional resolution photo; marks the work order resolved and drops the linked report's risk back to `Low`.

## Demo / dev scripts

- `seed.py` — one-shot demo data across Manyatta, Kondele, Nyalenda, and Obunga. Inserts a fresh batch each run (no natural key to upsert against) — run once per demo database.
- `telemetry_simulator.py` — streams slowly-drifting simulated clearance readings for four fixed culvert sensors into a running API (`uv run python telemetry_simulator.py`, Ctrl+C to stop). Stands in for real IoT hardware during the demo.

## Verifying manually

No automated test suite exists yet; a curl pass is the correctness check:

```bash
curl -X POST http://localhost:8000/reports \
  -F "photo=@/path/to/photo.jpg;type=image/jpeg" \
  -F "latitude=-0.0917" -F "longitude=34.768" -F "details=Test submission"
curl http://localhost:8000/reports
```
