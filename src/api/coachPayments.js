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

const getStripePlatform = (token) =>
  apiFetch("/api/payroll/connect/platform", { headers: authHeaders(token) });

const getCoachConnectStatuses = (token) =>
  apiFetch("/api/payroll/connect/coaches", { headers: authHeaders(token) });

const getMyConnectStatus = (token) =>
  apiFetch("/api/payroll/connect/me", { headers: authHeaders(token) });

const startStripeOnboarding = (token) =>
  apiFetch("/api/payroll/connect/onboard", { method: "POST", headers: authHeaders(token) });

const payCoachWithStripe = (id, token) =>
  apiFetch(`/api/payroll/${id}/stripe-payout`, { method: "POST", headers: authHeaders(token) });

export {
  getStripePlatform,
  getCoachConnectStatuses,
  getMyConnectStatus,
  startStripeOnboarding,
  payCoachWithStripe,
  getCoachPayments,
  getCoachPayees,
  createCoachPayment,
  updateCoachPaymentStatus,
  deleteCoachPayment,
};
