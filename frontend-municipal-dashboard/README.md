# NiWapi Municipal Dashboard

Responsive municipal GIS dashboard using Leaflet/OpenStreetMap. It is intentionally wired only to the endpoints that actually exist in the supplied backend.

## Run
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the FastAPI origin (default `http://localhost:8000`).
3. `npm install`
4. `npm run dev`
5. `npm run build`

## Important backend limitation
The supplied `backend/main.py` exposes only `GET /` and `GET /health`. Although `init_db.py` defines `reports`, `sensors` and `work_orders` tables, no CRUD API routes are implemented. The dashboard therefore shows truthful empty states rather than fabricated incidents, sensors or dispatch records.
