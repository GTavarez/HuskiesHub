import { baseUrl } from "../utils/constants";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? baseUrl;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, { ...options, headers });
  if (response.ok) {
    if (response.status === 204) return null;
    return response.json();
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  const message =
    data?.message || data?.error || `Request failed (${response.status})`;
  throw new ApiError(message, response.status, data);
}

export { apiFetch, ApiError };
