# NiWapi Field App

PWA/mobile-first citizen reporting client. It captures camera images, GPS, multilingual report details and stores reports in IndexedDB.

## Run
1. Copy `.env.example` to `.env.local`.
2. Set `VITE_API_BASE_URL` to the FastAPI origin (default `http://localhost:8000`).
3. `npm install`
4. `npm run dev`
5. `npm run build`

## Backend integration
Submitting a report queues it to IndexedDB first (offline-safe), then POSTs it to the backend's `POST /reports` immediately if online. Anything still queued syncs automatically on the next reconnect or app load — no manual retry needed.
