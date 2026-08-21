export type ApiHealth = { status: string; supabase_connected: boolean };
export type ApiRoot = { message: string };
export const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000").replace(/\/$/, "");
async function request<T>(path: string): Promise<T> { const r=await fetch(`${API_BASE_URL}${path}`,{headers:{Accept:"application/json"}}); if(!r.ok) throw new Error(`NiWapi API returned HTTP ${r.status}`); return r.json() as Promise<T>; }
export const api={root:()=>request<ApiRoot>("/"),health:()=>request<ApiHealth>("/health")};
