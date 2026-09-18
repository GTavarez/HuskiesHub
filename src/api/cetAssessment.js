import { apiFetch } from "./client";

const getCurrentAssessmentEvent = () => apiFetch("/api/cet-assessment/current-event");

const registerForAssessment = (payload) =>
  apiFetch("/api/cet-assessment/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const createAssessmentCheckout = (registrationId) =>
  apiFetch(`/api/cet-assessment/${registrationId}/checkout`, {
    method: "POST",
  });

const getAssessmentRegistration = (registrationId) =>
  apiFetch(`/api/cet-assessment/${registrationId}`);

export {
  getCurrentAssessmentEvent,
  registerForAssessment,
  createAssessmentCheckout,
  getAssessmentRegistration,
};
