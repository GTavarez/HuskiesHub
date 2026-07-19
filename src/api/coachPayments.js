import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getCoachPayments = (coachUserId, token) => {
  const query = coachUserId ? `?coachUserId=${coachUserId}` : "";
  return apiFetch(`/api/payroll${query}`, { headers: authHeaders(token) });
};

const createCoachPayment = (payload, token) =>
  apiFetch("/api/payroll", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateCoachPaymentStatus = (id, status, token) =>
  apiFetch(`/api/payroll/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });

export { getCoachPayments, createCoachPayment, updateCoachPaymentStatus };
