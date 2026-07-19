import { apiFetch } from "./client";

const getMessages = (teamId, token) =>
  apiFetch(`/api/messages/${teamId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export { getMessages };
