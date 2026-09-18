// Thin wrapper around gtag.js (loaded in index.html). send_page_view is
// disabled on the initial gtag config there, so every route change — including
// the first one — goes through here instead, otherwise GA4 only ever sees a
// single pageview no matter how much a visitor navigates the SPA.
function trackPageView(path) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export { trackPageView };
