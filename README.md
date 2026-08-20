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

- **Frontend:** React (Vite) + TypeScript, Tailwind CSS, React-Leaflet
- **Backend API:** Python, FastAPI, Uvicorn
- **Database & Storage:** Supabase (PostgreSQL + PostGIS + Storage)
- **AI / Vision:** Gemini Multimodal Vision API
- **Weather Telemetry:** Open-Meteo API

## Getting Started

*(Note: The project is currently completing Phase 1 of its initial hackathon execution plan. The basic backend API and frontend scaffolding have been initialized.)*

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- A Supabase Project with PostGIS enabled
- Gemini Vision API Key

### Environment Setup
Create a `.env` file in the root directory containing your Supabase connection details:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
GEMINI_API_KEY=your_gemini_api_key
```

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python init_db.py  # Initializes the PostGIS tables
uvicorn main:app --reload
```

### Frontend (React PWA)
```bash
cd frontend
npm install
npm run dev
```

---
*For complete implementation timelines and B2G pilot details, please reference the `docs/Plan.md` and `docs/Architecture.md` files.*
