import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getCoachPayments = (coachUserId, token) => {
  const query = coachUserId ? `?coachUserId=${coachUserId}` : "";
  return apiFetch(`/api/payroll${query}`, { headers: authHeaders(token) });
};

const getCoachPayees = (token) =>
  apiFetch("/api/payroll/payees", { headers: authHeaders(token) });

const createCoachPayment = (payload, token) =>
  apiFetch("/api/payroll", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const updateCoachPaymentStatus = (id, { status, method, reference }, token) =>
  apiFetch(`/api/payroll/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status, method, reference }),
  });

const deleteCoachPayment = (id, token) =>
  apiFetch(`/api/payroll/${id}`, { method: "DELETE", headers: authHeaders(token) });

export {
  getCoachPayments,
  getCoachPayees,
  createCoachPayment,
  updateCoachPaymentStatus,
  deleteCoachPayment,
};
