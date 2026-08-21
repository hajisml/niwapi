# NiWapi

**Climate Risk & Proactive Drainage Resilience Platform**

Built for the **Zone01 Kisumu GreenTech Hackathon 2026**, Track 6: Climate Risk Intelligence & Resilience Platform.

## The Problem
Urban and peri-urban centers across the Lake Victoria Basin face recurrent flash floods driven by extreme weather events and unmanaged surface runoff. While regional weather warning systems exist, urban flood vulnerability is heavily aggravated by local drainage failures (e.g., stormwater channels blocked by solid waste, siltation). Remediation is traditionally reactive—teams deploy *after* damage occurs.

## The Solution
**NiWapi** is an end-to-end climate risk intelligence platform that shifts flood response from reactive disaster management to proactive infrastructure readiness. It merges crowdsourced citizen blockage reports, real-time IoT water-level sensors, and predictive weather modeling to map, score, and remediate drainage chokepoints *before* rainfall triggers floods.

## System Architecture

The platform consists of several key components:
- **Citizen App (PWA):** A React/Vite-based Progressive Web App allowing users to capture geo-tagged photos of drainage blockages. Features offline caching (`IndexedDB`) to support low-connectivity field reporting.
- **FastAPI Backend:** Orchestrates data flow, linking images to Gemini Vision API for severity classification, fetching rainfall data from Open-Meteo, and calculating localized composite risk indices.
- **Supabase Layer:** Centralized spatial database utilizing PostgreSQL and PostGIS to query map data (`geometry(Point, 4326)`), store incident images, and manage real-time work-orders.
- **Municipal Web Portal:** Renders real-time incident pins, IoT sensor alert bubbles, weather risk zones, and work-order resolution queues via Leaflet mapping.
- **IoT Telemetry:** Simulates real-time ultrasonic water-level sensors streaming culvert clearance data.

### Risk Calculation Formula
Risk is calculated dynamically:
> `Vulnerability Score = (Blockage Severity [1-3] * Culvert Importance [1-3]) + (Forecasted Rainfall [mm] * 0.5)`

## Technology Stack

- **Frontend:** React (Vite) + TypeScript, React-Leaflet
- **Backend API:** Python, FastAPI, Uvicorn (uv-managed)
- **Database & Storage:** Postgres + PostGIS (local via Docker for dev; a hosted Supabase project is a drop-in swap, no code changes)
- **AI / Vision:** Gemini Multimodal Vision API (falls back to a deterministic mock classifier if no key is configured)
- **Weather Telemetry:** Open-Meteo API
- **Dev tooling:** mise (pinned Node/Python), uv (Python env/deps), Docker Compose (local Postgres+PostGIS)

## Getting Started

The backend and both frontends are wired together end-to-end: citizen report → AI classification → rainfall-adjusted risk score → municipal map/dispatch/resolution. A Supabase project and a real Gemini key are optional — local dev works fully without either.

### Prerequisites
- [mise](https://mise.jdx.dev/) (pins Node 24 and Python 3.12 for this repo — see `.mise.toml`)
- Docker (for local Postgres+PostGIS)
- Optional: a Supabase project and a Gemini Vision API key, for the real (non-local, non-mock) services

### Environment Setup
Copy the root `.env.example` to `.env` and adjust if needed — the defaults point at the Docker Postgres container and leave Supabase/Gemini blank (local storage + mock classifier):
```bash
cp .env.example .env
```

### Backend (FastAPI)
```bash
docker compose up -d db
cd backend
uv sync
uv run python init_db.py
uv run python seed.py   # optional: demo reports/sensors across Kisumu hotspots
uv run uvicorn main:app --reload
```
See `backend/README.md` for the full endpoint list and env var reference.

### Frontends (React PWAs)
Two separate apps, each with its own README:
```bash
cd frontend-field-app && npm install && npm run dev            # citizen reporting PWA
cd frontend-municipal-dashboard && npm install && npm run dev  # municipal GIS dashboard
```

---
*For complete implementation timelines and B2G pilot details, please reference the `docs/Plan.md` and `docs/Architecture.md` files.*
