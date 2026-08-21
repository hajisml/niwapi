export type ApiHealth = { status: string; database_connected: boolean };
export type ApiRoot = { message: string };
export type ReportOut = {
  id: number;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  severity: number | null;
  blockage_type: string | null;
  details: string | null;
  culvert_importance: number;
  forecasted_rainfall_mm: number | null;
  risk_score: number | null;
  risk_level: "Low" | "Medium" | "Critical" | null;
  status: string;
  created_at: string;
};

export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE_URL}${path}`, { headers: { Accept: "application/json" }, ...init });
  if (!r.ok) throw new Error(`NiWapi API returned HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

export const api = {
  root: () => request<ApiRoot>("/"),
  health: () => request<ApiHealth>("/health"),
  submitReport: (form: FormData) => request<ReportOut>("/reports", { method: "POST", body: form }),
};
