# Project Plan: NiWapi (Climate Risk & Drainage Resilience Platform)

**Track:** Track 6 — Climate Risk Intelligence & Resilience Platform  
**Hackathon:** Zone01 Kisumu GreenTech Hackathon 2026  
**Target Region:** Kisumu County & Lake Victoria Basin  

---

## 1. Executive Summary & Problem Statement

### The Problem
Urban and peri-urban centers across the Lake Victoria Basin face recurrent flash floods driven by extreme weather events and unmanaged surface runoff. While regional weather warning systems exist, urban flood vulnerability is heavily aggravated by local drainage failures:
* Stormwater channels and culverts blocked by solid waste, siltation, and overgrown vegetation.
* Municipalities lack real-time visibility into drainage bottlenecks before rain events occur.
* Remediation is reactive—teams deploy after damage occurs rather than conducting proactive clearance.

### The Solution: NiWapi
**NiWapi** is an end-to-end climate risk intelligence platform that shifts flood response from reactive disaster management to proactive infrastructure readiness. It merges crowdsourced citizen blockage reports, real-time IoT water-level sensors, and predictive weather modeling to map, score, and remediate drainage chokepoints before rainfall triggers floods.

---

## 2. Target Alignment & Bonus Points Strategy

| Rubric Focus | Planned Feature / Implementation | Score Weight |
| :--- | :--- | :--- |
| **Track 6 Fit** | Flood prediction, vulnerability dashboard, and resilience planning | 20% (Relevance) |
| **Emerging Tech #1** | **AI & Data Intelligence:** Computer Vision model to detect and classify blockage type/severity from user photos. | Mandatory + Tech Score |
| **Emerging Tech #2** | **Cloud & Edge Computing:** IoT sensor nodes calculating baseline clearance and water surge telemetry at culverts. | **+2 Bonus Points** |
| **County Pilot Plan** | Designed for integration with Kisumu County Directorate of Environment & Public Works. | **+2 Bonus Points** |
| **Offline-First Mode** | Progressive Web App (PWA) with client-side caching (IndexedDB) for low-connectivity field reporting. | **+1 Bonus Point** |

---

## 3. System Architecture & Core Specifications

### A. Citizen & Field Reporting PWA (Mobile)
* **Geo-tagged Photo Upload:** Captures camera feed, auto-fills GPS coordinates, and allows manual pin adjustment.
* **AI Image Triage:** Client/Edge or fast API inference to categorize blockage (e.g., Plastic Clutter, Silt/Debris, Structural Damage).
* **Offline-First Sync:** Stores pending submissions in `IndexedDB`/Local Storage and syncs automatically when network reconnects.

### B. Municipal Resilience & Dispatch Dashboard (Web)
* **GIS Vulnerability Map:** Interactive layer showing reported blockages, IoT sensor nodes, water flow directions, and low-lying flood basins.
* **Dynamic Risk Scoring Engine:** Calculates localized risk dynamically based on:
  $$\text{Vulnerability Score} = (\text{Blockage Severity} \times \text{Culvert Importance}) \times \text{Forecasted Rainfall Intensity}$$
* **Work Order Management:** Dispatch maintenance teams to flagged locations; crews upload "Resolution Proof" to clear tickets.

### C. IoT Water Level Telemetry Simulator
* Simulated or micro-controller-driven ultrasonic sensor feed monitoring clearance distance in culverts to detect silt buildup and early backflow.

---

## 4. Suggested Tech Stack

* **Frontend (Citizen PWA & Admin Dashboard):** React / Next.js, Tailwind CSS, Leaflet / MapLibre GL.
* **Backend & APIs:** Node.js (Express) or Python (FastAPI).
* **Database & Storage:** PostgreSQL with PostGIS extension (or Supabase/Firebase) + Cloudinary/S3 for images.
* **AI / Emerging Tech:** MobileNet / YOLO (via TensorFlow.js or lightweight FastAPI microservice).
* **Weather Data Source:** Open-Meteo API or Kenya Meteorological Department open feeds.

---

## 5. Work Distribution & Role Matrix

| Role | Core Responsibilities | Key Deliverables (48h Hackathon) |
| :--- | :--- | :--- |
| **Frontend Engineer 1 (PWA & Field App)** | Citizen report flow, camera integration, offline caching (Service Workers/IndexedDB), multilingual UI (English/Swahili/Luo). | Usable mobile-responsive PWA with offline report queueing. |
| **Frontend Engineer 2 (Municipal Dashboard)** | Interactive GIS map, risk heatmap visualization, dispatch ticket workflow, metrics overview. | Web portal showing active flood risks and dispatched cleanup crews. |
| **Backend & Data Engineer** | REST APIs, database schemas, weather API integration, risk calculation engine, IoT telemetry ingestion. | Functional API endpoints, automated risk scoring, seed database with Kisumu geospatial data. |
| **AI / Emerging Tech Specialist** | Computer vision inference pipeline for blockage images, IoT telemetry simulation script/hardware demo. | Image classification endpoint and live simulated stream of rising culvert levels. |
| **Product & Pitch Lead** | Slides deck, demo script, pilot integration proposal for Kisumu County, rubric audit. | 5-minute pitch deck, stakeholder pilot plan, video/live walkthrough orchestration. |

---

## 6. 48-Hour Implementation Timeline

* **Hours 00 – 06:** Finalize schema, setup repo, scaffold UI, mock data (Kisumu locations).
* **Hours 06 – 18:** Build core PWA submission flow, integrate map layers, setup backend CRUD.
* **Hours 18 – 30:** Connect AI image classification, integrate weather API, link live dispatching.
* **Hours 30 – 40:** Implement offline storage, IoT telemetry simulator, end-to-end data flow validation.
* **Hours 40 – 48:** UI polish, bug fixes, rehearse live interactive demo and slide deck pitch.

---

## 7. Live Demo Script (Step-by-Step)

1. **Step 1 (Offline Reporting):** Switch browser to offline mode. A resident logs a clogged culvert with a photo in Manyatta/Kondele. Show the report queued locally.
2. **Step 2 (Sync & AI Detection):** Reconnect network. Report syncs; the AI classifies it as "High-Density Plastic/Silt Blockage".
3. **Step 3 (Risk Escalation):** Weather integration pulls a 40mm heavy rain forecast for the evening. The system updates the area from "Low Risk" to "Critical Red Alert" on the Municipal Map.
4. **Step 4 (Dispatch & Resolution):** The admin assigns a county road crew. Crew updates the ticket with a cleared "after" photo.
5. **Step 5 (Resilience Score Drop):** The map automatically recalculates the risk zone back to "Safe / Green" before the storm hits.