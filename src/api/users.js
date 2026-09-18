import { apiFetch } from "./client";

const getCoaches = () => apiFetch("/coaches");

const linkChildToParent = ({ parentEmail, playerId }, token) =>
  apiFetch("/admin/link-child", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ parentEmail, playerId }),
  });

export { getCoaches, linkChildToParent };
