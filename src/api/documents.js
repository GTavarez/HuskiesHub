import { apiBaseUrl } from "../utils/config";
import { apiFetch, ApiError } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getDocuments = (teamId, token) => {
  const params = teamId ? `?teamId=${teamId}` : "";
  return apiFetch(`/api/documents${params}`, {
    headers: authHeaders(token),
  });
};

const uploadDocument = ({ title, visibility, teamId, file }, token) => {
  const formData = new FormData();
  formData.append("title", title);
  if (visibility) formData.append("visibility", visibility);
  if (teamId) formData.append("teamId", teamId);
  formData.append("file", file);

  return apiFetch("/api/documents", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
};

const deleteDocument = (id, token) =>
  apiFetch(`/api/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

// Auth-gated file download requires a fetch with an Authorization header —
// a plain <a href> can't attach one, so this resolves a same-origin blob URL instead.
const downloadDocumentBlobUrl = async (id, token) => {
  const response = await fetch(`${apiBaseUrl}/api/documents/${id}/download`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new ApiError("Failed to download document", response.status, null);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export { getDocuments, uploadDocument, deleteDocument, downloadDocumentBlobUrl };
