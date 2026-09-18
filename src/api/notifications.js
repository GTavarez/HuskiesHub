import { apiFetch } from "./client";

const getUpcomingNotifications = (token) =>
  apiFetch("/api/notifications/upcoming", {
    headers: { Authorization: `Bearer ${token}` },
  });

export { getUpcomingNotifications };
