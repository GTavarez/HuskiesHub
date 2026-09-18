import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const createConversation = (payload, token) =>
  apiFetch("/api/conversations", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

const getConversations = (teamId, token) =>
  apiFetch(`/api/conversations?teamId=${teamId}`, {
    headers: authHeaders(token),
  });

const getConversationMessages = (conversationId, token) =>
  apiFetch(`/api/conversations/${conversationId}/messages`, {
    headers: authHeaders(token),
  });

export { createConversation, getConversations, getConversationMessages };
