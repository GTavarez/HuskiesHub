import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const requestCollegeCoachAccess = (organization, token) =>
  apiFetch("/college-coach/request", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ organization }),
  });

const getPendingCollegeCoachRequests = (token) =>
  apiFetch("/admin/college-coach/pending", {
    headers: authHeaders(token),
  });

const approveCollegeCoach = (userId, token) =>
  apiFetch(`/admin/college-coach/${userId}/approve`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

const rejectCollegeCoach = (userId, token) =>
  apiFetch(`/admin/college-coach/${userId}/reject`, {
    method: "PATCH",
    headers: authHeaders(token),
  });

export {
  requestCollegeCoachAccess,
  getPendingCollegeCoachRequests,
  approveCollegeCoach,
  rejectCollegeCoach,
};
