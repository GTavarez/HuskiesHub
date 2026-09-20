import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

// kind: "opponent" (needs teamId) or "location" (club-wide).
const getSavedOptions = (kind, teamId, token) => {
  const params = new URLSearchParams({ kind });
  if (teamId) params.set("teamId", teamId);
  return apiFetch(`/api/saved-options?${params}`, { headers: authHeaders(token) });
};

export { getSavedOptions };
