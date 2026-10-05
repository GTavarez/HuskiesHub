// Pure helpers for how a chat message is shown. No React, so they are easy to test.

const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/g;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Splits text into plain, link and @mention pieces. `names` are the full names
// of people in the chat; "@Pat Coach" is only highlighted when it matches one.
function segmentMessage(text, names = []) {
  if (!text) return [];
  const sorted = [...names].filter(Boolean).sort((a, b) => b.length - a.length);
  const mentionPart = sorted.length ? `|(@(?:${sorted.map(escapeRegExp).join("|")}))` : "";
  const pattern = new RegExp(`${URL_PATTERN.source}${mentionPart}`, "gi");

  const segments = [];
  let last = 0;
  let match = pattern.exec(text);
  while (match) {
    if (match.index > last) segments.push({ type: "text", value: text.slice(last, match.index) });
    if (match[1]) segments.push({ type: "link", value: match[1] });
    else segments.push({ type: "mention", value: match[2] });
    last = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// "Today", "Yesterday", or "Mon, Oct 5" (with the year if it is not this year).
function dayLabel(date, now = new Date()) {
  const d = new Date(date);
  if (sameDay(d, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Yesterday";
  const options = { weekday: "short", month: "short", day: "numeric" };
  if (d.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return d.toLocaleDateString(undefined, options);
}

const timeLabel = (date) =>
  new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

// Messages in order, with a date divider before the first message of each day
// and a flag on messages that continue a run from the same sender (no repeated
// name/avatar within 5 minutes).
function layoutMessages(messages, now = new Date()) {
  const rows = [];
  let previous = null;
  messages.forEach((message) => {
    const created = new Date(message.createdAt);
    if (!previous || !sameDay(new Date(previous.createdAt), created)) {
      rows.push({ type: "day", key: `day-${message._id}`, label: dayLabel(created, now) });
    }
    const continues =
      previous &&
      sameDay(new Date(previous.createdAt), created) &&
      String(previous.senderId) === String(message.senderId) &&
      created - new Date(previous.createdAt) < 5 * 60 * 1000 &&
      !previous.deletedAt &&
      !message.deletedAt;
    rows.push({ type: "message", key: message._id, message, continues: Boolean(continues) });
    previous = message;
  });
  return rows;
}

// Adds or replaces a message by id, keeping oldest-to-newest order.
function upsertMessage(list, message) {
  const index = list.findIndex((m) => m._id === message._id);
  if (index === -1) return [...list, message];
  const next = [...list];
  next[index] = message;
  return next;
}

// "5 min", "3 hr", "Until tomorrow", "Muted" for the mute badge.
function muteLabel(mutedUntil, now = new Date()) {
  if (!mutedUntil) return "";
  const ms = new Date(mutedUntil) - now;
  if (ms <= 0) return "";
  if (ms > 5 * 365 * 24 * 3600 * 1000) return "Muted";
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `Muted ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Muted ${hours} hr`;
  return `Muted until ${new Date(mutedUntil).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

const unreadLabel = (count) => (count > 99 ? "99+" : String(count));

export { segmentMessage, dayLabel, timeLabel, layoutMessages, upsertMessage, muteLabel, unreadLabel };
