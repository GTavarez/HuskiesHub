import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

// ---- Public, no account required ----

const submitTryout = (payload) =>
  apiFetch("/api/tryouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ---- Admin ----

const getTryouts = (status, token) => {
  const params = status ? `?status=${status}` : "";
  return apiFetch(`/api/tryouts${params}`, { headers: authHeaders(token) });
};

const updateTryoutStatus = (id, status, token) =>
  apiFetch(`/api/tryouts/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });

const moveTryoutToTeam = (id, { teamId, jersey }, token) =>
  apiFetch(`/api/tryouts/${id}/move-to-team`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ teamId, jersey }),
  });

const deleteTryout = (id, token) =>
  apiFetch(`/api/tryouts/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export { submitTryout, getTryouts, updateTryoutStatus, moveTryoutToTeam, deleteTryout };
