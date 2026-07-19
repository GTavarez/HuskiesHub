import { apiFetch } from "./client";

const getSchedule = () => apiFetch("/api/schedule");

export { getSchedule };
