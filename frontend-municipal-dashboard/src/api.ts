export type ApiHealth = { status: string; database_connected: boolean };
export type ApiRoot = { message: string };

export type RiskLevel = "Low" | "Medium" | "Critical";

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
  risk_level: RiskLevel | null;
  status: string;
  created_at: string;
};

export type SensorOut = {
  id: number;
  label: string;
  latitude: number | null;
  longitude: number | null;
  clearance_distance: number;
  last_reading: string;
};

export type WorkOrderOut = {
  id: number;
  report_id: number;
  assigned_team: string;
  status: string;
  resolution_image_url: string | null;
  resolved_at: string | null;
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
  reports: () => request<ReportOut[]>("/reports"),
  sensors: () => request<SensorOut[]>("/sensors"),
  workOrders: () => request<WorkOrderOut[]>("/work-orders"),
  createWorkOrder: (reportId: number, assignedTeam: string) =>
    request<WorkOrderOut>("/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId, assigned_team: assignedTeam }),
    }),
  resolveWorkOrder: (id: number) => request<WorkOrderOut>(`/work-orders/${id}/resolve`, { method: "PATCH" }),
};
