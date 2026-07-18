import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getAttendance = ({ eventId, playerId }, token) => {
  const params = new URLSearchParams();
  if (eventId) params.set("eventId", eventId);
  if (playerId) params.set("playerId", playerId);
  return apiFetch(`/api/attendance?${params.toString()}`, {
    headers: authHeaders(token),
  });
};

const recordAttendance = ({ eventId, playerId, status }, token) =>
  apiFetch("/api/attendance", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ eventId, playerId, status }),
  });

export { getAttendance, recordAttendance };
