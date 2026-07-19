import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getRegistrations = ({ playerId, teamId, season } = {}, token) => {
  const params = new URLSearchParams();
  if (playerId) params.set("playerId", playerId);
  if (teamId) params.set("teamId", teamId);
  if (season) params.set("season", season);
  return apiFetch(`/api/registrations?${params.toString()}`, {
    headers: authHeaders(token),
  });
};

const createRegistration = (payload, token) =>
  apiFetch("/api/registrations", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateRegistration = (id, payload, token) =>
  apiFetch(`/api/registrations/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export { getRegistrations, createRegistration, updateRegistration };
