// Client-side mirror of the backend allowlist (src/common/utils/videoUrlAllowlist.js
// in HuskiesHub-backend) — this is just early UX feedback; the server-side
// check is the one that actually enforces "external video links only".
const ALLOWED_HOSTS = ["youtube.com", "youtu.be", "hudl.com", "vimeo.com"];

function isAllowedVideoUrl(url) {
  try {
    const { hostname } = new URL(url);
    const normalized = hostname.replace(/^www\./, "").toLowerCase();
    return ALLOWED_HOSTS.some(
      (host) => normalized === host || normalized.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export { isAllowedVideoUrl, ALLOWED_HOSTS };
