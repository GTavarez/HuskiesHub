import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getEntries = (playerId, token) =>
  apiFetch(`/api/performance/entries/${playerId}`, {
    headers: authHeaders(token),
  });

const createEntry = (payload, token) =>
  apiFetch("/api/performance/entries", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const getGoals = (playerId, token) =>
  apiFetch(`/api/performance/goals/${playerId}`, {
    headers: authHeaders(token),
  });

const createGoal = (payload, token) =>
  apiFetch("/api/performance/goals", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateGoal = (goalId, payload, token) =>
  apiFetch(`/api/performance/goals/${goalId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export { getEntries, createEntry, getGoals, createGoal, updateGoal };
