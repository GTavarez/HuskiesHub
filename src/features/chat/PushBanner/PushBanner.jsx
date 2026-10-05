import { useEffect, useState } from "react";
import { useToast } from "../../../context/ToastContext.js";
import { disablePush, enablePush, isIos, isSubscribed, pushState } from "../../../utils/push.js";
import { sendTestPush } from "../../../api/chat.js";
import "./PushBanner.css";

const DISMISS_KEY = "huskies:push-banner-dismissed";
const DISMISS_DAYS = 7;

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

// Asks people to turn on notifications so chat reaches them straight away,
// instead of waiting for the next email. Says what to do on an iPhone, where it
// only works once the site is on the Home Screen.
function PushBanner({ token }) {
  const { pushToast } = useToast();
  const [state, setState] = useState(() => pushState());
  const [subscribed, setSubscribed] = useState(false);
  const [dismissed, setDismissed] = useState(recentlyDismissed);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (pushState() !== "granted") return;
      if (await isSubscribed()) {
        if (!cancelled) setSubscribed(true);
        return;
      }
      // Permission was given before but this browser lost its subscription
      // (cleared data, new device): restore it quietly.
      try {
        await enablePush(token);
        if (!cancelled) setSubscribed(true);
      } catch {
        // A later visit will try again.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const turnOn = async () => {
    setBusy(true);
    try {
      const result = await enablePush(token);
      setState(pushState());
      if (result === "granted") {
        setSubscribed(true);
        pushToast({ type: "success", message: "Notifications are on." });
        sendTestPush(token).catch(() => {});
      } else if (result === "denied") {
        pushToast({ type: "error", message: "Notifications are blocked. Allow them in your browser settings." });
      }
    } catch (err) {
      pushToast({ type: "error", message: err?.message || "Couldn't turn on notifications." });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    await disablePush(token);
    setSubscribed(false);
    setBusy(false);
    pushToast({ type: "success", message: "Notifications are off on this device." });
  };

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Not remembering the dismissal is harmless.
    }
    setDismissed(true);
  };

  if (state === "granted" && subscribed) {
    return (
      <div className="push-banner push-banner--on">
        <span>🔔 Notifications are on for this device.</span>
        <button type="button" onClick={turnOff} disabled={busy}>
          Turn off
        </button>
      </div>
    );
  }
  if (dismissed || state === "unsupported") return null;

  if (state === "needs-install") {
    return (
      <div className="push-banner">
        <span>
          {isIos()
            ? "To get notifications on your iPhone: tap the Share button, choose Add to Home Screen, then open HuskiesHub from your Home Screen."
            : "Add HuskiesHub to your Home Screen to get notifications."}
        </span>
        <button type="button" onClick={dismiss}>
          Got it
        </button>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="push-banner">
        <span>Notifications are blocked for this site. Allow them in your browser settings to get messages instantly.</span>
        <button type="button" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="push-banner">
      <span>🔔 Get team messages and schedule changes the moment they happen.</span>
      <span className="push-banner__buttons">
        <button type="button" className="push-banner__primary" onClick={turnOn} disabled={busy}>
          {busy ? "Turning on…" : "Turn on notifications"}
        </button>
        <button type="button" onClick={dismiss} aria-label="Not now">
          Not now
        </button>
      </span>
    </div>
  );
}

export default PushBanner;
