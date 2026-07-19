import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getActiveWaiver = (token) =>
  apiFetch("/api/waivers/active", { headers: authHeaders(token) });

const createWaiverVersion = (payload, token) =>
  apiFetch("/api/waivers", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const signWaiver = (payload, token) =>
  apiFetch("/api/waiver-signatures", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const getWaiverSignatures = ({ playerId, waiverId } = {}, token) => {
  const params = new URLSearchParams();
  if (playerId) params.set("playerId", playerId);
  if (waiverId) params.set("waiverId", waiverId);
  return apiFetch(`/api/waiver-signatures?${params.toString()}`, {
    headers: authHeaders(token),
  });
};

export { getActiveWaiver, createWaiverVersion, signWaiver, getWaiverSignatures };
