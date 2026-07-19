import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const submitRoleRequest = (payload, token) =>
  apiFetch("/role-request", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const getPendingRoleRequests = (token) =>
  apiFetch("/admin/role-requests/pending", { headers: authHeaders(token) });

const approveRoleRequest = (userId, token) =>
  apiFetch(`/admin/role-requests/${userId}/approve`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

const rejectRoleRequest = (userId, token) =>
  apiFetch(`/admin/role-requests/${userId}/reject`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

export { submitRoleRequest, getPendingRoleRequests, approveRoleRequest, rejectRoleRequest };
