import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getAnnouncements = (teamId, token) => {
  const params = teamId ? `?teamId=${teamId}` : "";
  return apiFetch(`/api/announcements${params}`, {
    headers: authHeaders(token),
  });
};

// `image` (a File, admin-only) goes through as multipart/form-data so the
// backend can stream it straight into GridFS alongside the text fields.
const createAnnouncement = ({ image, ...payload }, token) => {
  if (!image) {
    return apiFetch("/api/announcements", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    });
  }

  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  formData.append("image", image);

  return apiFetch("/api/announcements", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
};

const deleteAnnouncement = (id, token) =>
  apiFetch(`/api/announcements/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export { getAnnouncements, createAnnouncement, deleteAnnouncement };
