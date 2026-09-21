import { apiBaseUrl } from "./config";

// Must match collegeKey() in the backend (modules/college-logos/controller.js):
// the college name reduced to lowercase letters and digits.
function collegeLogoKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

// `version` changes on every upload, so a replaced logo gets a fresh URL.
function collegeLogoUrl(key, version) {
  return `${apiBaseUrl}/api/college-logos/${key}/image?v=${version}`;
}

export { collegeLogoKey, collegeLogoUrl };
