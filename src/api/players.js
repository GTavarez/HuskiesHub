import { apiFetch } from "./client";

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

export { createPlayer, updatePlayer };
