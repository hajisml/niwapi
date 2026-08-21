import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { api, API_BASE_URL } from "./api";
import { riskLevel, vulnerabilityScore } from "./risk";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Metric({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return <div className="metric"><span className={`metric-accent ${accent || ""}`} /><strong>{value}</strong><small>{label}</small></div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><div className="empty-symbol">—</div><strong>{title}</strong><p>{text}</p></div>;
}

function App() {
  const [online, setOnline] = useState(navigator.onLine);
  const [health, setHealth] = useState<"checking" | "ready" | "unreachable">("checking");
  const preview = useMemo(() => vulnerabilityScore(3, 3, 0), []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener("online", on);
    addEventListener("offline", off);
    api.health().then(() => setHealth("ready")).catch(() => setHealth("unreachable"));
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-inner">
          <img className="dashboard-logo" src="/niwapi-logo.png" alt="NiWapi — Climate Risk & Drainage Resilience" />
          <div className="header-title"><strong>Municipal Command Centre</strong><span>Kisumu County · Track 6</span></div>
          <div className="head-status">
            <span className={online ? "online" : "offline"}><i />{online ? "ONLINE" : "OFFLINE"}</span>
            <span>API {health}</span>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="intro">
          <div>
            <p className="eyebrow">CLIMATE RISK & DRAINAGE RESILIENCE</p>
            <h1>Flood prevention command view</h1>
            <p>Prioritize citizen reports, water-level alerts and cleanup activity from one operational surface.</p>
          </div>
          <div className="connection-card"><span>Configured backend</span><code>{API_BASE_URL}</code></div>
        </section>

        <section className="metrics">
          <Metric value="—" label="Active incidents" />
          <Metric value="—" label="Critical risk" accent="red" />
          <Metric value="—" label="Sensor alerts" accent="amber" />
          <Metric value="—" label="Open work orders" accent="green" />
        </section>

        <section className="main-grid">
          <div className="panel map-panel">
            <div className="panel-head">
              <div><p className="panel-kicker">GEOSPATIAL VIEW</p><h2>Drainage vulnerability map</h2><p>Live report and sensor markers will populate when their backend routes are available.</p></div>
              <div className="legend"><span><i className="low" />Low</span><span><i className="medium" />Medium</span><span><i className="critical" />Critical</span></div>
            </div>
            <div className="map-wrap">
              <MapContainer center={[-0.0917, 34.768]} zoom={13} scrollWheelZoom>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker icon={icon} position={[-0.0917, 34.768]}>
                  <Popup><strong>NiWapi Kisumu</strong><br />Map is ready. The supplied backend does not yet expose report/sensor data routes.</Popup>
                </Marker>
              </MapContainer>
              <div className="map-overlay"><span>MAP DATA</span><strong>Backend feed pending</strong></div>
            </div>
          </div>

          <aside className="panel risk-panel">
            <div className="panel-head"><div><p className="panel-kicker">PRIORITIZATION</p><h2>Risk levels</h2></div></div>
            <div className="risk-stack">
              <div className="risk-row critical"><div><span>Critical</span><small>Immediate preventive dispatch</small></div><strong>7+</strong></div>
              <div className="risk-row medium"><div><span>Medium</span><small>Scheduled drainage response</small></div><strong>4–6</strong></div>
              <div className="risk-row low"><div><span>Low</span><small>Routine monitoring</small></div><strong>0–3</strong></div>
            </div>
            <div className="formula">
              <span>NiWapi vulnerability model</span>
              <code>(Severity × Culvert Importance) + (Rainfall × 0.5)</code>
              <small>Example: severity 3 × importance 3 = {preview} without forecast rainfall.</small>
            </div>
          </aside>
        </section>

        <section className="lower-grid">
          <div className="panel">
            <div className="panel-head"><div><p className="panel-kicker">FIELD REPORTS</p><h2>Active incidents</h2><p>Critical incidents will be ranked first once the report API is available.</p></div><span className="panel-count">0 loaded</span></div>
            <Empty title="No live incident feed" text="The supplied FastAPI backend currently exposes only GET / and GET /health; no report-list endpoint exists." />
          </div>
          <div className="panel">
            <div className="panel-head"><div><p className="panel-kicker">OPERATIONS</p><h2>Dispatch & work orders</h2><p>Operational controls are prepared for the backend work-order routes.</p></div></div>
            <Empty title="No work-order feed" text="The database defines work_orders, but backend/main.py currently exposes no work-order API routes." />
          </div>
        </section>

        <section className="sources panel">
          <div className="panel-head"><div><p className="panel-kicker">DATA READINESS</p><h2>Platform feeds</h2></div></div>
          <div className="source-grid">
            <div><span className="source-dot unavailable" /><div><strong>Citizen reports</strong><small>Backend route not exposed</small></div></div>
            <div><span className="source-dot unavailable" /><div><strong>IoT water levels</strong><small>Database table exists; API route not exposed</small></div></div>
            <div><span className="source-dot unavailable" /><div><strong>Weather / rainfall</strong><small>No backend endpoint discovered</small></div></div>
            <div><span className="source-dot unavailable" /><div><strong>AI blockage analysis</strong><small>No backend endpoint discovered</small></div></div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <div><img src="/niwapi-mark.png" alt="" /><span><strong>NiWapi</strong> · Climate Risk & Drainage Resilience</span></div>
          <span>Frontend intentionally makes no fabricated API calls.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
