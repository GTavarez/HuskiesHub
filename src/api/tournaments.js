import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getTournaments = (token) =>
  apiFetch("/api/tournaments", { headers: authHeaders(token) });

const getTournament = (id, token) =>
  apiFetch(`/api/tournaments/${id}`, { headers: authHeaders(token) });

const createTournament = (payload, token) =>
  apiFetch("/api/tournaments", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateTournament = (id, payload, token) =>
  apiFetch(`/api/tournaments/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const getHotelReservationsForTournament = (tournamentId, token) =>
  apiFetch(`/api/tournaments/${tournamentId}/hotel-reservations`, {
    headers: authHeaders(token),
  });

const createHotelReservation = (tournamentId, payload, token) =>
  apiFetch(`/api/tournaments/${tournamentId}/hotel-reservations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const getPendingHotelReservations = (token) =>
  apiFetch("/api/hotel-reservations", { headers: authHeaders(token) });

const updateHotelReservationStatus = (id, payload, token) =>
  apiFetch(`/api/hotel-reservations/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  getHotelReservationsForTournament,
  createHotelReservation,
  getPendingHotelReservations,
  updateHotelReservationStatus,
};
