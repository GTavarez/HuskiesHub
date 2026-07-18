import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getDashboard = (token) =>
  apiFetch("/api/analytics/dashboard", { headers: authHeaders(token) });

export { getDashboard };
