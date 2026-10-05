import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });
const json = (method, token, body) => ({
  method,
  headers: authHeaders(token),
  body: JSON.stringify(body),
});

const createConversation = (payload, token) => apiFetch("/api/conversations", json("POST", token, payload));

const getConversations = (teamId, token) =>
  apiFetch(`/api/conversations?teamId=${teamId}`, { headers: authHeaders(token) });

const getConversationMessages = (conversationId, token) =>
  apiFetch(`/api/conversations/${conversationId}/messages`, { headers: authHeaders(token) });

const renameConversation = (id, name, token) =>
  apiFetch(`/api/conversations/${id}`, json("PATCH", token, { name }));

const addConversationMembers = (id, memberIds, token) =>
  apiFetch(`/api/conversations/${id}/members`, json("POST", token, { memberIds }));

const removeConversationMember = (id, userId, token) =>
  apiFetch(`/api/conversations/${id}/members/${userId}`, { method: "DELETE", headers: authHeaders(token) });

// Private messages: who you may message, and starting (or reopening) one.
const getDirectMessageCandidates = (teamId, token) =>
  apiFetch(`/api/conversations/dm-candidates?teamId=${teamId}`, { headers: authHeaders(token) });

const createDirectConversation = (teamId, otherUserId, token) =>
  apiFetch("/api/conversations/direct", json("POST", token, { teamId, otherUserId }));

export {
  createConversation,
  getConversations,
  getConversationMessages,
  renameConversation,
  addConversationMembers,
  removeConversationMember,
  getDirectMessageCandidates,
  createDirectConversation,
};
