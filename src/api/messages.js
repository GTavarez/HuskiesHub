import { apiFetch, API_BASE_URL, ApiError } from "./client";

const getMessages = (teamId, token) =>
  apiFetch(`/api/messages/${teamId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// Posts a photo (plus optional caption) into a team room or a group chat.
// The server broadcasts the new message over the socket, so callers don't
// need to add it to the list themselves.
const sendChatPhoto = ({ teamId, conversationId, file, text }, token) => {
  const body = new FormData();
  body.append("photo", file);
  if (conversationId) body.append("conversationId", conversationId);
  else body.append("teamId", teamId);
  if (text) body.append("text", text);
  return apiFetch("/api/messages/photo", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
};

// Chat photos sit behind auth, so an <img src> can't load them directly.
// Fetches the bytes with the token and hands back a blob the caller turns
// into an object URL.
const getChatPhotoBlob = async (messageId, token) => {
  const response = await fetch(`${API_BASE_URL}/api/messages/photo/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new ApiError(`Could not load photo (${response.status})`, response.status, null);
  }
  return response.blob();
};

export { getMessages, sendChatPhoto, getChatPhotoBlob };
