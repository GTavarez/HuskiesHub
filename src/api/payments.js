import { apiBaseUrl } from "../utils/config";
import { apiFetch, ApiError } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const createCheckoutSession = ({ type, productId, registrationId }, token) =>
  apiFetch("/api/payments/checkout-session", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ type, productId, registrationId }),
  });

const createSetupSession = ({ registrationId }, token) =>
  apiFetch("/api/payments/setup-session", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ registrationId }),
  });

const getBalance = (playerId, token) =>
  apiFetch(`/api/payments/balance?playerId=${playerId}`, {
    headers: authHeaders(token),
  });

const getPaymentHistory = (userId, token) => {
  const params = userId ? `?userId=${userId}` : "";
  return apiFetch(`/api/payments/history${params}`, {
    headers: authHeaders(token),
  });
};

const refundPayment = (paymentId, amountCents, token) =>
  apiFetch(`/api/payments/${paymentId}/refund`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(amountCents ? { amountCents } : {}),
  });

const runAutopay = (token) =>
  apiFetch("/api/payments/run-autopay", {
    method: "POST",
    headers: authHeaders(token),
  });

const sendReminders = (token) =>
  apiFetch("/api/payments/send-reminders", {
    method: "POST",
    headers: authHeaders(token),
  });

// Auth-gated file download requires a fetch with an Authorization header —
// a plain <a href> can't attach one, so this resolves a same-origin blob URL instead.
const exportQuickbooksCsvBlobUrl = async ({ from, to }, token) => {
  const response = await fetch(
    `${apiBaseUrl}/api/payments/export/quickbooks?from=${from}&to=${to}`,
    { headers: authHeaders(token) }
  );
  if (!response.ok) {
    throw new ApiError("Failed to export CSV", response.status, null);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export {
  createCheckoutSession,
  createSetupSession,
  getBalance,
  getPaymentHistory,
  refundPayment,
  runAutopay,
  sendReminders,
  exportQuickbooksCsvBlobUrl,
};
