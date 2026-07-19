import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const askAssistant = (question, token) =>
  apiFetch("/api/ai-assistant/ask", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ question }),
  });

export { askAssistant };
