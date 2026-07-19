import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getAnnouncements = (teamId, token) => {
  const params = teamId ? `?teamId=${teamId}` : "";
  return apiFetch(`/api/announcements${params}`, {
    headers: authHeaders(token),
  });
};

const createAnnouncement = (payload, token) =>
  apiFetch("/api/announcements", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const deleteAnnouncement = (id, token) =>
  apiFetch(`/api/announcements/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export { getAnnouncements, createAnnouncement, deleteAnnouncement };
