import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ImageOff, Inbox, X } from "lucide-react";
import L from "leaflet";
import { api, API_BASE_URL, type ReportOut, type SensorOut, type WorkOrderOut } from "./api";
import { vulnerabilityScore } from "./risk";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const DEFAULT_TEAM = "County Public Works Crew";
const POLL_INTERVAL_MS = 15000;
const SENSOR_ALERT_CLEARANCE_CM = 15;

function riskColor(level: string | null) {
  return level === "Critical" ? "#ff0000" : level === "Medium" ? "#e1a900" : "#36a25c";
}

function reportIcon(level: string | null) {
  return L.divIcon({
    className: "risk-marker",
    html: `<span style="background:${riskColor(level)}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const sensorIcon = L.divIcon({ className: "sensor-marker", html: "<span></span>", iconSize: [14, 14], iconAnchor: [7, 7] });

function Metric({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return <div className="metric"><span className={`metric-accent ${accent || ""}`} /><strong>{value}</strong><small>{label}</small></div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><div className="empty-symbol"><Inbox size={18} /></div><strong>{title}</strong><p>{text}</p></div>;
}

function ReportModal({ report, onClose }: { report: ReportOut; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  const level = (report.risk_level ?? "Low").toLowerCase();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className={`modal-risk-badge ${level}`}>{report.risk_level ?? "Unclassified"}</span>
            <h2>{report.blockage_type ?? "Unclassified blockage"}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close report details">
            <X size={18} />
          </button>
        </div>

        {report.image_url ? (
          <img className="modal-photo" src={report.image_url} alt="Reported drainage blockage" />
        ) : (
          <div className="modal-photo modal-photo-empty">
            <ImageOff size={28} />
            <span>No photo attached</span>
          </div>
        )}

        <div className="modal-grid">
          <div><span>Severity</span><strong>{report.severity ?? "—"} / 3</strong></div>
          <div><span>Risk score</span><strong>{report.risk_score?.toFixed(1) ?? "—"}</strong></div>
          <div><span>Forecast rainfall</span><strong>{report.forecasted_rainfall_mm?.toFixed(1) ?? "—"} mm</strong></div>
          <div><span>Culvert importance</span><strong>{report.culvert_importance} / 3</strong></div>
          <div><span>Status</span><strong>{report.status}</strong></div>
          <div><span>Reported</span><strong>{new Date(report.created_at).toLocaleString()}</strong></div>
          <div><span>Coordinates</span><strong>{report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}</strong></div>
        </div>

        {report.details && (
          <div className="modal-notes">
            <span>Field notes</span>
            <p>{report.details}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [online, setOnline] = useState(navigator.onLine);
  const [health, setHealth] = useState<"checking" | "ready" | "unreachable">("checking");
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [sensors, setSensors] = useState<SensorOut[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderOut[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const preview = useMemo(() => vulnerabilityScore(3, 3, 0), []);
  const selectedReport = reports.find((r) => r.id === selectedReportId) ?? null;

  const refresh = useCallback(async () => {
    try {
      const [reportList, sensorList, workOrderList] = await Promise.all([api.reports(), api.sensors(), api.workOrders()]);
      setReports(reportList);
      setSensors(sensorList);
      setWorkOrders(workOrderList);
      setHealth("ready");
    } catch {
      setHealth("unreachable");
    }
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener("online", on);
    addEventListener("offline", off);
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
      clearInterval(interval);
    };
  }, [refresh]);

  const dispatch = async (reportId: number) => {
    setBusyId(reportId);
    try {
      await api.createWorkOrder(reportId, DEFAULT_TEAM);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const resolve = async (workOrderId: number) => {
    setBusyId(workOrderId);
    try {
      await api.resolveWorkOrder(workOrderId);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const criticalCount = reports.filter((r) => r.risk_level === "Critical").length;
  const sensorAlertCount = sensors.filter((s) => s.clearance_distance <= SENSOR_ALERT_CLEARANCE_CM).length;
  const openWorkOrderCount = workOrders.filter((w) => w.status === "dispatched").length;
  const dispatchedReportIds = new Set(workOrders.map((w) => w.report_id));
  const openWorkOrders = workOrders.filter((w) => w.status === "dispatched");

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
          <Metric value={String(reports.length)} label="Active incidents" />
          <Metric value={String(criticalCount)} label="Critical risk" accent="red" />
          <Metric value={String(sensorAlertCount)} label="Sensor alerts" accent="amber" />
          <Metric value={String(openWorkOrderCount)} label="Open work orders" accent="green" />
        </section>

        <section className="main-grid">
          <div className="panel map-panel">
            <div className="panel-head">
              <div><p className="panel-kicker">GEOSPATIAL VIEW</p><h2>Drainage vulnerability map</h2><p>Report and sensor markers refresh every {POLL_INTERVAL_MS / 1000}s.</p></div>
              <div className="legend"><span><i className="low" />Low</span><span><i className="medium" />Medium</span><span><i className="critical" />Critical</span></div>
            </div>
            <div className="map-wrap">
              <MapContainer center={[-0.0917, 34.768]} zoom={12} scrollWheelZoom>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {reports.filter((r) => r.latitude !== null && r.longitude !== null).map((r) => (
                  <Marker key={`report-${r.id}`} icon={reportIcon(r.risk_level)} position={[r.latitude as number, r.longitude as number]}>
                    <Popup>
                      <strong>{r.blockage_type ?? "Unclassified blockage"}</strong>
                      <br />Risk: {r.risk_level} ({r.risk_score?.toFixed(1)})
                      <br />Status: {r.status}
                      {r.details && <><br />{r.details}</>}
                      <br /><button className="popup-link" type="button" onClick={() => setSelectedReportId(r.id)}>View full report</button>
                    </Popup>
                  </Marker>
                ))}
                {sensors.filter((s) => s.latitude !== null && s.longitude !== null).map((s) => (
                  <Marker key={`sensor-${s.id}`} icon={sensorIcon} position={[s.latitude as number, s.longitude as number]}>
                    <Popup>
                      <strong>{s.label}</strong>
                      <br />Clearance: {s.clearance_distance.toFixed(1)} cm
                      <br />Last reading: {new Date(s.last_reading).toLocaleString()}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="map-overlay"><span>MAP DATA</span><strong>{reports.length} reports · {sensors.length} sensors</strong></div>
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
            <div className="panel-head"><div><p className="panel-kicker">FIELD REPORTS</p><h2>Active incidents</h2><p>Ranked by computed risk; dispatch a crew directly from here.</p></div><span className="panel-count">{reports.length} loaded</span></div>
            {reports.length === 0 ? (
              <Empty title="No live incident feed" text="No citizen reports have been submitted yet." />
            ) : (
              <div className="risk-stack">
                {reports.map((r) => (
                  <div
                    className={`risk-row clickable ${(r.risk_level ?? "low").toLowerCase()}`}
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedReportId(r.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedReportId(r.id);
                      }
                    }}
                  >
                    <div>
                      <span>{r.blockage_type ?? "Unclassified"}</span>
                      <small>{r.details || "No field notes"} · {r.status}</small>
                    </div>
                    <div className="risk-actions">
                      <strong>{r.risk_score?.toFixed(1) ?? "—"}</strong>
                      {r.status === "pending" && !dispatchedReportIds.has(r.id) && (
                        <button
                          className="outline-button"
                          type="button"
                          disabled={busyId === r.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            dispatch(r.id);
                          }}
                        >
                          {busyId === r.id ? "Dispatching…" : "Dispatch"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="panel">
            <div className="panel-head"><div><p className="panel-kicker">OPERATIONS</p><h2>Dispatch & work orders</h2><p>Crews clear the blockage, then close the ticket here.</p></div><span className="panel-count">{openWorkOrderCount} open</span></div>
            {openWorkOrders.length === 0 ? (
              <Empty title="No open work orders" text="Dispatch a crew from an active incident to open a work order." />
            ) : (
              <div className="risk-stack">
                {openWorkOrders.map((w) => (
                  <div className="risk-row medium" key={w.id}>
                    <div>
                      <span>Report #{w.report_id}</span>
                      <small>{w.assigned_team} · dispatched {new Date(w.created_at).toLocaleString()}</small>
                    </div>
                    <button className="outline-button" type="button" disabled={busyId === w.id} onClick={() => resolve(w.id)}>
                      {busyId === w.id ? "Resolving…" : "Mark resolved"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="sources panel">
          <div className="panel-head"><div><p className="panel-kicker">DATA READINESS</p><h2>Platform feeds</h2></div></div>
          <div className="source-grid">
            <div><span className={`source-dot ${health === "ready" ? "live" : "unavailable"}`} /><div><strong>Citizen reports</strong><small>{health === "ready" ? "Live from /reports" : "Backend unreachable"}</small></div></div>
            <div><span className={`source-dot ${health === "ready" ? "live" : "unavailable"}`} /><div><strong>IoT water levels</strong><small>{health === "ready" ? "Live from /sensors" : "Backend unreachable"}</small></div></div>
            <div><span className="source-dot live" /><div><strong>Weather / rainfall</strong><small>Open-Meteo, fetched per report</small></div></div>
            <div><span className="source-dot live" /><div><strong>AI blockage analysis</strong><small>Gemini Vision, mock fallback without a key</small></div></div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <div><img src="/niwapi-mark.png" alt="" /><span><strong>NiWapi</strong> · Climate Risk & Drainage Resilience</span></div>
          <span>All data above is served live by the NiWapi API.</span>
        </footer>
      </main>

      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReportId(null)} />}
    </div>
  );
}

export default App;
