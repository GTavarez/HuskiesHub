import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getProfile = (playerId, token) =>
  apiFetch(`/api/recruiting-profiles/${playerId}`, {
    headers: authHeaders(token),
  });

const upsertProfile = (playerId, payload, token) =>
  apiFetch(`/api/recruiting-profiles/${playerId}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const searchProfiles = (criteria, token) => {
  const params = new URLSearchParams();
  Object.entries(criteria || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  return apiFetch(`/api/recruiting-profiles/search?${params.toString()}`, {
    headers: authHeaders(token),
  });
};

export { getProfile, upsertProfile, searchProfiles };
