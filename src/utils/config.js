const DEFAULT_LOCAL_API_URL = "http://localhost:8080";
const DEFAULT_PROD_API_URL =
  "https://huskieshub-backend-891073803869.us-central1.run.app";

const isProduction = import.meta.env.PROD;

const apiBaseUrl = (
  import.meta.env.VITE_API_URL ||
  (isProduction ? DEFAULT_PROD_API_URL : DEFAULT_LOCAL_API_URL)
).replace(/\/+$/, "");

const socketUrl = (import.meta.env.VITE_SOCKET_URL || apiBaseUrl).replace(
  /\/+$/,
  ""
);

const mediaBaseUrl = (
  import.meta.env.VITE_MEDIA_BASE_URL ||
  apiBaseUrl
).replace(/\/+$/, "");

export { apiBaseUrl, mediaBaseUrl, socketUrl };
