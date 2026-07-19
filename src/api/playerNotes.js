import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getPlayerNotes = (playerId, token) =>
  apiFetch(`/api/player-notes?playerId=${playerId}`, {
    headers: authHeaders(token),
  });

const createPlayerNote = (payload, token) =>
  apiFetch("/api/player-notes", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const deletePlayerNote = (id, token) =>
  apiFetch(`/api/player-notes/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export { getPlayerNotes, createPlayerNote, deletePlayerNote };
