// RSVPs are recorded per *account*, but a team is made of *players*: one player
// can have two parents plus a login of her own, and each of those accounts can
// answer. This folds the accounts back down to one entry per player so the
// attendance list doesn't show the same player several times.
//
// `contacts` come from GET /api/players/team/:teamId/contacts, where
// `attendeeName` is already the player's name for parent and player accounts.

const STATUSES = ["yes", "maybe", "no"];

const attendeeKey = (contact) =>
  String(contact.attendeeName || contact.name || contact._id)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

function summarizeRsvps(rsvps, contacts) {
  const contactById = new Map(contacts.map((c) => [String(c._id), c]));

  // One entry per player. If several of a player's accounts answered
  // differently, the most recent answer wins.
  const latestByAttendee = new Map();
  (rsvps || []).forEach((rsvp) => {
    const contact = contactById.get(String(rsvp.userId));
    if (!contact || !STATUSES.includes(rsvp.status)) return;
    const key = attendeeKey(contact);
    const at = new Date(rsvp.respondedAt || 0).getTime();
    const current = latestByAttendee.get(key);
    if (!current || at >= current.at) {
      latestByAttendee.set(key, { at, status: rsvp.status, name: contact.attendeeName || contact.name });
    }
  });

  const byStatus = { yes: [], maybe: [], no: [] };
  latestByAttendee.forEach(({ status, name }) => byStatus[status].push(name));

  const notYetResponded = [];
  const seen = new Set();
  contacts.forEach((contact) => {
    const key = attendeeKey(contact);
    if (latestByAttendee.has(key) || seen.has(key)) return;
    seen.add(key);
    notYetResponded.push(contact.attendeeName || contact.name);
  });

  Object.values(byStatus).forEach((names) => names.sort((a, b) => a.localeCompare(b)));
  notYetResponded.sort((a, b) => a.localeCompare(b));

  return { ...byStatus, notYetResponded, respondedCount: latestByAttendee.size };
}

export { summarizeRsvps, attendeeKey };
