import { apiBaseUrl } from "../utils/config";
import { apiFetch, ApiError } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const createPlayer = (payload, token) =>
  apiFetch("/api/players", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updatePlayer = (playerId, payload, token) =>
  apiFetch(`/api/players/${playerId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

// Private phone and contact email; only the family, their coach and admins may read them.
const getPlayerContact = (playerId, token) =>
  apiFetch(`/api/players/${playerId}/contact`, {
    headers: authHeaders(token),
  });

// Private phone, email, city and SAT/ACT for a whole team, for the showcase
// sheet. Admins and that team's coach only.
const getTeamShowcaseDetails = (teamId, token) =>
  apiFetch(`/api/players/team/${teamId}/showcase-details`, {
    headers: authHeaders(token),
  });

const deletePlayer = (playerId, token) =>
  apiFetch(`/api/players/${playerId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

const getTeamContacts = (teamId, token) =>
  apiFetch(`/api/players/team/${teamId}/contacts`, {
    headers: authHeaders(token),
  });

// Auth-gated file download requires a fetch with an Authorization header —
// a plain <a href> can't attach one, so this resolves a same-origin blob URL instead.
const exportContactsCsvBlobUrl = async (token) => {
  const response = await fetch(`${apiBaseUrl}/api/players/export/contacts`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new ApiError("Failed to export CSV", response.status, null);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export { getTeamShowcaseDetails, getPlayerContact, createPlayer, updatePlayer, deletePlayer, exportContactsCsvBlobUrl, getTeamContacts };
