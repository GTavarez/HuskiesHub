/* HuskiesHub service worker: shows push notifications and opens the right
   page when one is tapped. It deliberately does no caching, so it can never
   serve a stale copy of the app. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "HuskiesHub", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "HuskiesHub";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    // The same tag replaces the previous notification from the same chat
    // instead of stacking a new one per message; `renotify` still alerts.
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    requireInteraction: Boolean(data.urgent),
    data: { url: data.url || "/" },
  };

  // If the app is open and focused, the page already shows the message, so
  // skip the system notification.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const focused = windows.some((w) => w.focused && w.visibilityState === "visible");
      if (focused && !data.urgent) return undefined;
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Reuse an open tab if there is one; otherwise open a new window.
      const existing = windows.find((w) => w.url.startsWith(self.location.origin));
      if (existing) {
        return existing.focus().then((focused) => (focused && focused.navigate ? focused.navigate(target) : undefined));
      }
      return self.clients.openWindow(target);
    })
  );
});
