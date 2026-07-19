import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getLessonSlots = (filters, token) => {
  const params = new URLSearchParams(filters || {}).toString();
  return apiFetch(`/api/lesson-slots${params ? `?${params}` : ""}`, {
    headers: authHeaders(token),
  });
};

const createLessonSlot = (payload, token) =>
  apiFetch("/api/lesson-slots", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateLessonSlot = (id, payload, token) =>
  apiFetch(`/api/lesson-slots/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const deleteLessonSlot = (id, token) =>
  apiFetch(`/api/lesson-slots/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export { getLessonSlots, createLessonSlot, updateLessonSlot, deleteLessonSlot };
