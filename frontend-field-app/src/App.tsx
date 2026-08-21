import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Camera, CheckCircle2, Globe, ImageOff, LocateFixed, X } from "lucide-react";
import { api, API_BASE_URL } from "./api";
import { riskLevel, vulnerabilityScore } from "./risk";
import "./styles.css";

type Lang = "en" | "sw" | "luo";
type Draft = {
  id: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
  severity: number;
  blockageType: string;
  details: string;
  createdAt: string;
};

const COPY = {
  en: {
    title: "Report a drainage blockage",
    subtitle: "Capture evidence, location and severity. NiWapi keeps your report safe when the network is unavailable.",
    photo: "Evidence photo",
    gps: "Location",
    severity: "Blockage severity",
    type: "Blockage type",
    details: "Field notes",
    save: "Save report",
    locate: "Capture GPS",
    saved: "Report saved offline.",
    remove: "Remove",
    queue: "Offline queue",
    noQueue: "No reports waiting to sync.",
    required: "Add a photo, GPS location and field notes before saving.",
    gpsNone: "No GPS captured yet",
    online: "Online",
    offline: "Offline",
    api: "Backend",
    ready: "Connected",
    unavailable: "Unavailable",
  },
  sw: {
    title: "Ripoti ya kuziba mfereji",
    subtitle: "Piga picha, hifadhi eneo na ukali. NiWapi huhifadhi ripoti hata bila mtandao.",
    photo: "Picha ya ushahidi",
    gps: "Mahali",
    severity: "Ukali wa kuziba",
    type: "Aina ya kuziba",
    details: "Maelezo ya eneo",
    save: "Hifadhi ripoti",
    locate: "Pata GPS",
    saved: "Ripoti imehifadhiwa bila mtandao.",
    remove: "Ondoa",
    queue: "Foleni ya nje ya mtandao",
    noQueue: "Hakuna ripoti inayosubiri kusawazishwa.",
    required: "Weka picha, GPS na maelezo kabla ya kuhifadhi.",
    gpsNone: "GPS haijapatikana",
    online: "Mtandaoni",
    offline: "Nje ya mtandao",
    api: "Mfumo",
    ready: "Imeunganishwa",
    unavailable: "Haipatikani",
  },
  luo: {
    title: "Ripoti yore ma ok opog",
    subtitle: "Chak picha, kanyo gi liet. NiWapi ok wil ripoti kata ka network onge.",
    photo: "Picha mariek",
    gps: "Kanyo",
    severity: "Liet mariek",
    type: "Kit mariek",
    details: "Lok mag kanyo",
    save: "Kan ripoti",
    locate: "Yud GPS",
    saved: "Ripoti osik e device.",
    remove: "Golo",
    queue: "Ripoti ma osekano",
    noQueue: "Onge ripoti ma orito.",
    required: "Chak picha, GPS gi lok kapok ikan.",
    gpsNone: "GPS pod onge",
    online: "Online",
    offline: "Offline",
    api: "Backend",
    ready: "Osewinjo",
    unavailable: "Ok owinjo",
  },
} as const;

const BLOCKAGE_TYPES = [
  "Plastic / solid waste",
  "Silt / debris",
  "Vegetation",
  "Structural damage",
  "Other",
];

const db = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open("niwapi-field", 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains("reports")) {
      request.result.createObjectStore("reports", { keyPath: "id" });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function putDraft(draft: Draft) {
  const database = await db;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("reports", "readwrite");
    transaction.objectStore("reports").put(draft);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getDrafts() {
  const database = await db;
  return new Promise<Draft[]>((resolve, reject) => {
    const request = database.transaction("reports").objectStore("reports").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteDraft(id: string) {
  const database = await db;
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("reports", "readwrite");
    transaction.objectStore("reports").delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

function App() {
  const [lang, setLang] = useState<Lang>("en");
  const t = COPY[lang];
  const [photo, setPhoto] = useState<string>();
  const [lat, setLat] = useState<number>();
  const [lng, setLng] = useState<number>();
  const [severity, setSeverity] = useState(2);
  const [kind, setKind] = useState(BLOCKAGE_TYPES[0]);
  const [details, setDetails] = useState("");
  const [queue, setQueue] = useState<Draft[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [apiState, setApiState] = useState<"checking" | "ready" | "unreachable">("checking");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncQueue = async () => {
    const pending = await getDrafts();
    if (pending.length === 0 || syncing) return;
    setSyncing(true);
    let synced = 0;
    for (const draft of pending) {
      try {
        if (!draft.photo || draft.latitude === undefined || draft.longitude === undefined) continue;
        const form = new FormData();
        form.append("photo", await dataUrlToBlob(draft.photo), "report.jpg");
        form.append("latitude", String(draft.latitude));
        form.append("longitude", String(draft.longitude));
        form.append("details", draft.details);
        await api.submitReport(form);
        await deleteDraft(draft.id);
        synced += 1;
      } catch {
        // Stays queued; retried on the next reconnect or app load.
      }
    }
    setQueue(await getDrafts());
    setSyncing(false);
    if (synced > 0) setMessage(`${synced} report${synced === 1 ? "" : "s"} synced to NiWapi.`);
  };

  useEffect(() => {
    const on = () => {
      setOnline(true);
      syncQueue();
    };
    const off = () => setOnline(false);
    addEventListener("online", on);
    addEventListener("offline", off);
    getDrafts().then((drafts) => {
      setQueue(drafts);
      if (navigator.onLine && drafts.length > 0) syncQueue();
    });
    api.health().then(() => setApiState("ready")).catch(() => setApiState("unreachable"));
    return () => {
      removeEventListener("online", on);
      removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (online) {
      api.health().then(() => setApiState("ready")).catch(() => setApiState("unreachable"));
    }
  }, [online]);

  const captureGPS = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setMessage("GPS location captured.");
      },
      () => setMessage("Location permission was denied or the position is unavailable."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const capturePhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const score = useMemo(() => vulnerabilityScore(severity, 2, 0), [severity]);
  const level = riskLevel(score);

  const saveReport = async () => {
    if (!photo || lat === undefined || lng === undefined || !details.trim()) {
      setMessage(t.required);
      return;
    }

    setSaving(true);
    try {
      const draft: Draft = {
        id: crypto.randomUUID(),
        photo,
        latitude: lat,
        longitude: lng,
        severity,
        blockageType: kind,
        details: details.trim(),
        createdAt: new Date().toISOString(),
      };
      await putDraft(draft);
      setQueue(await getDrafts());
      setMessage(t.saved);
      setPhoto(undefined);
      setDetails("");
      if (navigator.onLine) syncQueue();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="field-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <img className="brand-logo" src="/niwapi-logo.png" alt="NiWapi — Climate Risk & Drainage Resilience" />
          <div className="topbar-actions">
            <span className={`connection ${online ? "is-online" : "is-offline"}`}>
              <span className="connection-dot" />
              {online ? t.online : t.offline}
            </span>
            <label className="lang-select">
              <Globe size={14} />
              <select aria-label="Language" value={lang} onChange={(event) => setLang(event.target.value as Lang)}>
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
                <option value="luo">Dholuo</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="field-main">
        <section className="hero">
          <div>
            <p className="eyebrow">KISUMU COUNTY · FIELD REPORTING</p>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="hero-badge">
            <strong>{queue.length}</strong>
            <span>{t.queue}</span>
          </div>
        </section>

        <div className="status-strip">
          <span><b>{t.api}</b> {apiState === "ready" ? t.ready : apiState === "unreachable" ? t.unavailable : "Checking…"}</span>
          <span><b>{t.queue}</b> {queue.length}</span>
          <span><b>Risk model</b> Live preview</span>
        </div>

        <section className="card">
          <div className="section-heading">
            <div>
              <span className="step">01</span>
              <div><h2>{t.photo}</h2><p>Attach a clear photo of the obstruction.</p></div>
            </div>
          </div>
          <label className="upload-zone">
            <input type="file" accept="image/*" capture="environment" onChange={(event) => capturePhoto(event.target.files?.[0])} />
            <span className="upload-icon"><Camera size={20} /></span>
            <strong>{photo ? "Replace photo" : "Take or choose a photo"}</strong>
            <small>Camera and image library are supported.</small>
          </label>
          {photo && (
            <div className="photo-preview">
              <img src={photo} alt="Drainage blockage preview" />
              <button type="button" onClick={() => setPhoto(undefined)}>{t.remove}</button>
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <span className="step">02</span>
              <div><h2>{t.gps}</h2><p>Use the device GPS to place the incident accurately.</p></div>
            </div>
            <button className="outline-button" type="button" onClick={captureGPS}><LocateFixed size={14} /> {t.locate}</button>
          </div>
          <div className="coordinates">
            <span className={lat !== undefined ? "coordinates-live" : ""}>●</span>
            {lat !== undefined ? `${lat.toFixed(6)}, ${lng?.toFixed(6)}` : t.gpsNone}
          </div>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <span className="step">03</span>
              <div><h2>{t.severity}</h2><p>Rate the visible blockage from 1 (minor) to 3 (severe).</p></div>
            </div>
          </div>

          <div className="severity-control">
            <div className="severity-labels"><span>1 · Minor</span><strong>{severity} / 3</strong><span>3 · Severe</span></div>
            <input type="range" min="1" max="3" value={severity} onChange={(event) => setSeverity(Number(event.target.value))} />
          </div>

          <div className={`risk-preview ${level.toLowerCase()}`}>
            <div><span>Preview vulnerability score</span><strong>{score.toFixed(1)}</strong></div>
            <b>{level}</b>
            <small>Severity × culvert importance + forecast rainfall × 0.5. The backend recomputes this from AI classification and live rainfall forecast on submit.</small>
          </div>

          <label className="field-label">
            {t.type}
            <select value={kind} onChange={(event) => setKind(event.target.value)}>{BLOCKAGE_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
          </label>

          <label className="field-label">
            {t.details}
            <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={5} placeholder="Nearby landmark, obstruction type, water flow, access concerns…" />
          </label>
        </section>

        {message && <div className="notice"><span><AlertTriangle size={13} /></span><p>{message}</p><button type="button" onClick={() => setMessage("")}><X size={16} /></button></div>}

        <button className="submit-button" type="button" onClick={saveReport} disabled={saving}>
          <span>{saving ? "Saving…" : t.save}</span><ArrowRight size={18} />
        </button>

        <section className="card queue-card">
          <div className="section-heading">
            <div><span className="step">04</span><div><h2>{t.queue}</h2><p>Reports sync to NiWapi automatically once the device is back online.</p></div></div>
            <span className="queue-count">{queue.length}</span>
          </div>
          {queue.length === 0 ? (
            <div className="empty-state"><span><CheckCircle2 size={16} /></span><strong>{t.noQueue}</strong></div>
          ) : (
            <div className="queue-list">
              {queue.slice().reverse().map((draft) => (
                <article className="queue-item" key={draft.id}>
                  {draft.photo ? <img src={draft.photo} alt="" /> : <div className="queue-placeholder"><ImageOff size={20} /></div>}
                  <div><strong>{draft.blockageType}</strong><span>{new Date(draft.createdAt).toLocaleString()}</span><span>{draft.latitude?.toFixed(5)}, {draft.longitude?.toFixed(5)}</span><em>{syncing ? "Syncing…" : online ? "Waiting to sync" : "Waiting for connection"}</em></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="field-footer">
          <img src="/niwapi-mark.png" alt="" />
          <div><strong>NiWapi</strong><span>Climate Risk & Drainage Resilience</span></div>
          <code>{API_BASE_URL}</code>
        </footer>
      </main>
    </div>
  );
}

export default App;
