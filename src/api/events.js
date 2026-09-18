import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getEvents = (teamId, token, { from, to } = {}) => {
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return apiFetch(`/api/events?${params.toString()}`, {
    headers: authHeaders(token),
  });
};

const getEvent = (eventId, token) =>
  apiFetch(`/api/events/${eventId}`, { headers: authHeaders(token) });

const createEvent = (payload, token) =>
  apiFetch("/api/events", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateEvent = (eventId, payload, token) =>
  apiFetch(`/api/events/${eventId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const deleteEvent = (eventId, token) =>
  apiFetch(`/api/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

const cancelEvent = (eventId, notifyTeam, token) =>
  apiFetch(`/api/events/${eventId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ notifyTeam }),
  });

const rsvpToEvent = (eventId, status, token) =>
  apiFetch(`/api/events/${eventId}/rsvp`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });

export { getEvents, getEvent, createEvent, updateEvent, deleteEvent, cancelEvent, rsvpToEvent };
