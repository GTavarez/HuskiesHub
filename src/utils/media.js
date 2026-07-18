import { mediaBaseUrl } from "./config.js";

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

function resolveMediaUrl(path) {
  if (!path) return "";
  if (ABSOLUTE_URL_PATTERN.test(path)) return path;
  return `${mediaBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function resolveImageUrl(value, directory = "images") {
  if (!value) return "";
  if (ABSOLUTE_URL_PATTERN.test(value)) return value;

  const normalizedValue = String(value).trim().replace(/^\/+/, "");
  if (!normalizedValue) return "";
  if (normalizedValue.startsWith(`${directory}/`)) {
    return resolveMediaUrl(normalizedValue);
  }
  if (normalizedValue.includes("/")) {
    return resolveMediaUrl(normalizedValue);
  }
  if (/\.[a-z0-9]+$/i.test(normalizedValue)) {
    return resolveMediaUrl(`/${directory}/${normalizedValue}`);
  }

  return resolveMediaUrl(`/${directory}/${normalizedValue}.jpg`);
}

export { resolveImageUrl, resolveMediaUrl };
