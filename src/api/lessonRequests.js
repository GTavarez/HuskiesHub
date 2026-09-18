import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

// ---- Public — no account required ----

const getOpenLessonRequestSlots = () => apiFetch("/api/lesson-requests/open-slots");

const getLessonRequestSchedule = () => apiFetch("/api/lesson-requests/schedule");

const submitLessonRequest = (payload) =>
  apiFetch("/api/lesson-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const getLessonRequestActionSummary = (token) =>
  apiFetch(`/api/lesson-requests/action?token=${encodeURIComponent(token)}`);

const applyLessonRequestAction = (token, action) =>
  apiFetch("/api/lesson-requests/action", {
    method: "POST",
    body: JSON.stringify({ token, action }),
  });

// ---- Admin ----

const getLessonRequests = (view, token) => {
  const params = view ? `?view=${view}` : "";
  return apiFetch(`/api/lesson-requests${params}`, {
    headers: authHeaders(token),
  });
};

const confirmLessonRequest = (id, token) =>
  apiFetch(`/api/lesson-requests/${id}/confirm`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

const declineLessonRequest = (id, token) =>
  apiFetch(`/api/lesson-requests/${id}/decline`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

const updateLessonRequestPaymentStatus = (id, paymentStatus, token) =>
  apiFetch(`/api/lesson-requests/${id}/payment-status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ paymentStatus }),
  });

const createLessonRequestSlot = (payload, token) =>
  apiFetch("/api/lesson-requests/slots", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateLessonRequestSlot = (id, payload, token) =>
  apiFetch(`/api/lesson-requests/slots/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const deleteLessonRequestSlot = (id, token) =>
  apiFetch(`/api/lesson-requests/slots/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

export {
  getOpenLessonRequestSlots,
  getLessonRequestSchedule,
  submitLessonRequest,
  getLessonRequestActionSummary,
  applyLessonRequestAction,
  getLessonRequests,
  confirmLessonRequest,
  declineLessonRequest,
  updateLessonRequestPaymentStatus,
  createLessonRequestSlot,
  updateLessonRequestSlot,
  deleteLessonRequestSlot,
};
