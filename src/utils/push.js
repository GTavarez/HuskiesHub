import { getPushKey, subscribePush, unsubscribePush } from "../api/chat.js";

// Browser side of notifications: register the service worker, ask permission,
// subscribe, and tell the server.

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

// "unsupported": this browser can't do it. "needs-install": iPhones only allow
// notifications for a site added to the Home Screen. Otherwise the permission.
function pushState() {
  if (typeof window === "undefined") return "unsupported";
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

// Returns "granted" on success, or the reason it didn't work.
async function enablePush(token) {
  const state = pushState();
  if (state === "unsupported" || state === "needs-install" || state === "denied") return state;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const registration = await getRegistration();
  const { publicKey } = await getPushKey(token);
  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  await subscribePush(subscription.toJSON(), token);
  return "granted";
}

async function disablePush(token) {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await unsubscribePush(subscription.endpoint, token).catch(() => {});
  await subscription.unsubscribe();
}

// Whether this browser is currently subscribed.
async function isSubscribed() {
  if (pushState() !== "granted") return false;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return Boolean(await registration?.pushManager.getSubscription());
}

export { pushState, enablePush, disablePush, isSubscribed, isIos };
