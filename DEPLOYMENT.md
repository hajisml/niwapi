# Deploying NiWapi

Backend on [Render](https://render.com) (Docker web service), both frontends on [Vercel](https://vercel.com). Database, storage, and (optionally) Gemini Vision already live on Supabase — the backend itself is stateless, so nothing here needs a persistent disk.

## 1. Backend (Render)

The repo root has a `render.yaml` blueprint (`backend/Dockerfile` + `backend/.dockerignore` back it) so Render can configure the service automatically instead of filling in a form by hand.

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In the Render dashboard: **New → Blueprint**, connect this GitHub repo. Render reads `render.yaml` and proposes one web service, `niwapi-backend`.
3. Render will prompt for the 4 env vars declared with `sync: false` in `render.yaml` — fill them in with the same values as your local `.env`:
   - `DATABASE_URL` — your Supabase **pooler** connection string (`...pooler.supabase.com:6543/postgres`), not the direct `db.<ref>.supabase.co:5432` one — Render's network is IPv4, and Supabase's direct connection is IPv6-only unless you're on their paid IPv4 add-on.
   - `SUPABASE_URL` — the bare project URL (`https://<ref>.supabase.co`), not a `/rest/v1` or other sub-path.
   - `SUPABASE_KEY` — your Supabase secret/service key.
   - `GEMINI_API_KEY` — optional; leave blank to use the mock blockage classifier in production too.
4. Deploy. Render builds `backend/Dockerfile` and runs `uv run uvicorn main:app --host 0.0.0.0 --port $PORT` — the health check is configured against `GET /health`.
5. Once live, run the schema bootstrap **once** against that same Supabase project (from your machine, with `.env` pointed at it): `cd backend && uv run python init_db.py`. This only needs to happen once per Supabase project, not per deploy — Render doesn't run it automatically.
6. Note the live backend URL (`https://niwapi-backend.onrender.com` or similar) — the frontends need it next.

CORS is currently wide open (`allow_origins=["*"]` in `backend/main.py`) so any frontend origin can call it — fine for a hackathon demo; worth scoping down to the two real frontend origins later.

## 2. Frontends (Vercel)

Each frontend is its own Vercel project pointed at the same repo with a different **root directory**. Run these from the repo root, once per app:

```bash
cd frontend-field-app          # then repeat this whole block from frontend-municipal-dashboard
npx vercel login               # browser login, one-time per machine
npx vercel link                # creates/links the Vercel project; when asked for root directory, confirm the current folder
npx vercel env add VITE_API_BASE_URL production
# paste the live Render backend URL from step 1.6 (no trailing slash)
npx vercel --prod
```

Repeat for `frontend-municipal-dashboard`. Vercel auto-detects the Vite build (`npm run build` → `dist/`), no `vercel.json` needed.

## 3. Verify

- `curl https://<render-url>/health` → `{"status":"ok","database_connected":true}`
- Open the field app's Vercel URL, submit a test report.
- Open the dashboard's Vercel URL, confirm the report shows up on the map and incident list, and that Dispatch/Resolve/the report detail modal all work against the live backend.
