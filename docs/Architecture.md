# NiWapi: System Architecture, Execution Roadmap & Business Perspective

**Platform:** NiWapi — Climate Risk & Proactive Drainage Resilience Platform  
**Target Region:** Kisumu County & Lake Victoria Basin  
**Hackathon:** Zone01 Kisumu GreenTech Hackathon 2026  

---

## 1. Final Tech Stack Decisions

| Layer | Selected Technology | Role & Justification |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + Tailwind CSS | Fast client setup, zero SSR overhead, responsive mobile & desktop UI. |
| **Mapping & GIS** | Leaflet / React-Leaflet | Free OpenStreetMap tiles, zero API keys required, lightweight GeoJSON/marker rendering. |
| **Backend API** | Python (FastAPI) | Asynchronous request handling, native Pydantic validation, auto-generated interactive API docs (`/docs`). |
| **Database & Storage** | **Supabase (PostgreSQL + PostGIS + Supabase Storage)** | Managed PostgreSQL with native spatial queries, instant REST/real-time subscriptions, and built-in image bucket storage. |
| **AI / Vision** | Multimodal Vision API (Gemini Vision) | Instant structured JSON triage of blockage severity and type without manual model training or dataset labeling. |
| **Weather Telemetry** | Open-Meteo API | Free, open API for Kisumu coordinates requiring no API key to fetch rainfall forecasts. |
| **Edge Simulation** | Python IoT Telemetry Script | Simulates ultrasonic water-level sensors streaming clearance data into Supabase via REST. |

---

## 2. Complete System Architecture

```
                              [ CITIZEN / FIELD USER ]
                                          │
                               (Takes Photo + GPS Tag)
                                          ▼
                         [ React + Vite PWA / Mobile UI ]
                                          │
                     ┌────────────────────┴────────────────────┐
                     │ (Offline: IndexedDB)                    │ (Online Upload)
                     ▼                                         ▼
             [ Local Queue ] ──(Syncs on Reconnect)──> [ FastAPI Backend ]
                                                               │
                     ┌─────────────────────────────────────────┼────────────────────────────────────────┐
                     │                                         │                                        │
                     ▼                                         ▼                                        ▼
         [ Gemini Vision API ]                       [ Open-Meteo API ]                       [ Supabase Storage ]
       (Extracts Blockage Data)                   (Fetches Rainfall Forecast)                    (Stores Images)
                     │                                         │                                        │
                     └────────────────────┬────────────────────┘                                        │
                                          ▼                                                             │
                               [ Risk Calculation Engine ]                                              │
                                          │                                                             │
                                          ▼                                                             ▼
                            [ Supabase DB (PostgreSQL + PostGIS) ] <────────────────────────────────────┘
                                          ▲
                                          │ (Simulated Sensor Ingestion)
                                [ IoT Telemetry Script ]
                                          │
                                          ▼
                             [ Municipal Admin Dashboard ]
                         (GIS Vulnerability Map & Work Orders)

```

### Architectural Components
* **Citizen Client (PWA):** Captures geo-coordinates, base64/binary image, and handles offline caching using browser storage.
* **FastAPI Microservices:** Orchestrates multi-step intake: saves images to Supabase Storage, passes URLs to the Vision API for classification, queries Open-Meteo for rainfall, computes the composite risk index, and commits spatial records to Supabase DB.
* **Supabase Layer:** Acts as the centralized spatial database (`geometry(Point, 4326)`), authentication provider, and image store.
* **Municipal Web Portal:** Renders real-time incident pins, IoT sensor alert bubbles, weather risk zones, and work-order resolution queues.

---

## 3. Data Flow & Processing Sequence


```

Citizen App             FastAPI Backend             Vision API          Open-Meteo        Supabase (DB & Storage)     Admin Map
│                          │                        │                   │                    │                   │
├── 1. POST Report ───────>│                        │                   │                    │                   │
│   (Photo + Lat/Long)     ├── 2. Upload Image ─────────────────────────────────────────────>│                   │
│                          │<── Image Public URL ────────────────────────────────────────────┤                   │
│                          ├── 3. Analyze Image ───>│                   │                    │                   │
│                          │<── JSON (Type, Sevr) ──┤                   │                    │                   │
│                          ├── 4. Get Rain Data ───────────────────────>│                    │                   │
│                          │<── Precip mm/hr ───────────────────────────┤                    │                   │
│                          ├── 5. Compute Risk Score│                   │                    │                   │
│                          ├── 6. Insert Spatial Record ────────────────────────────────────>│                   │
│<── 7. Return Success ────┤                                                                 ├── 8. Real-time ──>│
│                          │                                                                 │      Update Event │

```

### Risk Calculation Formula
$$\text{Vulnerability Score} = (\text{Blockage Severity [1--3]} \times \text{Culvert Importance [1--3]}) + (\text{Forecasted Rainfall [mm]} \times 0.5)$$

* **0 – 3:** Low (Green — Normal Monitoring)
* **4 – 6:** Medium (Yellow — Scheduled Sweeps)
* **7+ :** Critical (Red Alert — Immediate Preventive Dispatch)

---

## 4. 48-Hour Hackathon Execution Roadmap


```

Hours 00 - 06 ───► Hours 06 - 18 ───► Hours 18 - 30 ───► Hours 30 - 40 ───► Hours 40 - 48
[ Setup & DB ]    [ Core Features ]   [ AI & Integrations ] [ Edge & Polish ]  [ Pitch & Demo ]

```

* **Phase 1: Foundations (Hours 00 – 06)**
  * Spin up Supabase project: create `reports`, `sensors`, and `work_orders` tables with PostGIS enabled.
  * Initialize FastAPI backend boilerplate with CORS and Supabase client SDK.
  * Initialize React (Vite) frontend with Tailwind CSS and Leaflet basemap.

* **Phase 2: Core Reporting & Mapping (Hours 06 – 18)**
  * Build PWA photo capture + GPS location extraction.
  * Build admin dashboard Leaflet map rendering geo-tagged markers.
  * Implement basic backend CRUD endpoints for incident reports.

* **Phase 3: AI & External API Integration (Hours 18 – 30)**
  * Connect FastAPI to Gemini Vision API with structured JSON output prompts.
  * Integrate Open-Meteo API to pull 24-hour precipitation forecasts for Kisumu.
  * Implement dynamic risk scoring logic based on rainfall + AI blockage classification.

* **Phase 4: Telemetry, Offline Queue & Workflows (Hours 30 – 40)**
  * Implement client-side `IndexedDB`/Service Worker offline caching for the PWA.
  * Write a Python script to simulate real-time IoT water-level sensor telemetry.
  * Build admin work-order dispatch & resolution verification (uploading "after" photos).

* **Phase 5: Rehearsal, Polish & Pitch Deck (Hours 40 – 48)**
  * Seed realistic demo data across key Kisumu hotspots (Manyatta, Kondele, Nyalenda, Obunga).
  * Run end-to-end demo dry runs (Offline submission $\rightarrow$ AI classification $\rightarrow$ Red risk escalation $\rightarrow$ Dispatch $\rightarrow$ Resolution).
  * Finalize slide deck and practice a 5-minute timed presentation.

---

## 5. Business & Startup Perspective

### A. Value Proposition
* **For County Governments & Municipalities:** Lowers disaster relief expenses by replacing expensive emergency flood evacuations with low-cost, targeted, preventive drainage maintenance.
* **For Citizens:** Empowers local neighborhoods with a transparent reporting channel and direct visibility into community infrastructure readiness.

### B. Business & Revenue Model (B2G & B2B)
* **B2G SaaS (Primary):** Tiered municipal subscriptions for county public works departments and city directorates (custom GIS routing, automated crew dispatch, predictive analytics dashboards).
* **B2B Infrastructure Risk Intelligence (Secondary):** API access for property developers, micro-insurers, and logistics companies operating within flood-prone economic corridors.
* **Development Agency Grants:** Non-dilutive climate adaptation and resilience funding (e.g., LakeHub incubation, UNEP, World Bank climate tech programs).

### C. Go-To-Market Strategy (Kisumu Pilot)
* **Phase 1 (Validation Pilot):** Partner with LakeHub and Kisumu County Directorate of Environment to pilot NiWapi in two flood-prone informal settlements (e.g., Manyatta and Nyalenda).
* **Phase 2 (Community Engagement):** Partner with local youth groups and community-based organizations (CBOs) for crowd-mapping drives ahead of the rainy season.
* **Phase 3 (Regional Expansion):** Scale the SaaS model to neighboring Lake Victoria Basin counties (Siaya, Homa Bay, Busia, Migori) facing identical topography and drainage challenges.
