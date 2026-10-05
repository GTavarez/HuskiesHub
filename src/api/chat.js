import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });
const json = (method, token, body) => ({
  method,
  headers: authHeaders(token),
  body: JSON.stringify(body),
});

// A room is named by exactly one of { teamId } | { conversationId } | { eventId }.
const roomQuery = (room) => new URLSearchParams(room).toString();

// ---------- overview ----------
const getChatSummary = (teamId, token) =>
  apiFetch(`/api/chat/summary${teamId ? `?teamId=${teamId}` : ""}`, { headers: authHeaders(token) });

const getRoomInfo = (room, token) =>
  apiFetch(`/api/chat/room?${roomQuery(room)}`, { headers: authHeaders(token) });

const markRoomRead = (room, token) => apiFetch("/api/chat/read", json("POST", token, room));

// minutes | { forever: true } | { unmute: true }
const muteRoom = (room, options, token) =>
  apiFetch("/api/chat/mute", json("POST", token, { ...room, ...options }));

const getRoomMembers = (room, token) =>
  apiFetch(`/api/chat/members?${roomQuery(room)}`, { headers: authHeaders(token) });

const getSeenBy = (room, messageId, token) =>
  apiFetch(`/api/chat/seen?${roomQuery({ ...room, messageId })}`, { headers: authHeaders(token) });

const getPinned = (room, token) =>
  apiFetch(`/api/chat/pinned?${roomQuery(room)}`, { headers: authHeaders(token) });

const updateRoomSettings = (room, settings, token) =>
  apiFetch("/api/chat/settings", json("PATCH", token, { ...room, ...settings }));

// ---------- messages ----------
const getRoomMessages = (room, token, before) => {
  const query = before ? `?before=${before}` : "";
  if (room.conversationId) return apiFetch(`/api/conversations/${room.conversationId}/messages${query}`, { headers: authHeaders(token) });
  if (room.eventId) return apiFetch(`/api/messages/event/${room.eventId}${query}`, { headers: authHeaders(token) });
  return apiFetch(`/api/messages/${room.teamId}${query}`, { headers: authHeaders(token) });
};

const editMessage = (id, text, token) => apiFetch(`/api/messages/${id}`, json("PATCH", token, { text }));
const deleteMessage = (id, token) => apiFetch(`/api/messages/${id}`, { method: "DELETE", headers: authHeaders(token) });
const pinMessage = (id, token) => apiFetch(`/api/messages/${id}/pin`, json("POST", token, {}));
const unpinMessage = (id, token) => apiFetch(`/api/messages/${id}/unpin`, json("POST", token, {}));
const reactToMessage = (id, emoji, token) => apiFetch(`/api/messages/${id}/react`, json("POST", token, { emoji }));
const reportMessage = (id, reason, token) => apiFetch(`/api/messages/${id}/report`, json("POST", token, { reason }));

// ---------- reports (admin) ----------
const getChatReports = (status, token) =>
  apiFetch(`/api/chat/reports?status=${status}`, { headers: authHeaders(token) });
const resolveChatReport = (id, action, token) =>
  apiFetch(`/api/chat/reports/${id}/resolve`, json("POST", token, { action }));

// ---------- notifications ----------
const getPushKey = (token) => apiFetch("/api/chat/push/public-key", { headers: authHeaders(token) });
const subscribePush = (subscription, token) =>
  apiFetch("/api/chat/push/subscribe", json("POST", token, { subscription }));
const unsubscribePush = (endpoint, token) =>
  apiFetch("/api/chat/push/unsubscribe", json("POST", token, { endpoint }));
const getPushStatus = (token) => apiFetch("/api/chat/push/status", { headers: authHeaders(token) });
const sendTestPush = (token) => apiFetch("/api/chat/push/test", json("POST", token, {}));

export {
  getRoomInfo,
  getChatSummary,
  markRoomRead,
  muteRoom,
  getRoomMembers,
  getSeenBy,
  getPinned,
  updateRoomSettings,
  getRoomMessages,
  editMessage,
  deleteMessage,
  pinMessage,
  unpinMessage,
  reactToMessage,
  reportMessage,
  getChatReports,
  resolveChatReport,
  getPushKey,
  subscribePush,
  unsubscribePush,
  getPushStatus,
  sendTestPush,
};
