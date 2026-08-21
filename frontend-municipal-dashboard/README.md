# NiWapi Municipal Dashboard

Responsive municipal GIS dashboard using Leaflet/OpenStreetMap, wired to the live NiWapi API.

## Run
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the FastAPI origin (default `http://localhost:8000`).
3. `npm install`
4. `npm run dev`
5. `npm run build`

## Backend integration
Reports, sensors, and work orders are fetched from the backend on load and re-polled every 15 seconds; map markers are colored by computed risk level. The incident list's Dispatch button and the work-order panel's Mark-resolved button call the backend directly (`POST /work-orders`, `PATCH /work-orders/{id}/resolve`). The `Empty` state still shows when a list is genuinely empty — e.g. no reports submitted yet — not because an endpoint is missing.
