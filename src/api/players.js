import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const updatePlayer = (playerId, payload, token) =>
  apiFetch(`/api/players/${playerId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export { updatePlayer };
