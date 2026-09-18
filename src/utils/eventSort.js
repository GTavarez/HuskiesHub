// Puts today/upcoming events first (soonest first), then past events below
// (most recent past first) — so opening an attendance/availability list
// lands on what's actually relevant instead of requiring a scroll through
// months of old practices to reach today.
function sortEventsForAttendance(events) {
  const now = Date.now();
  const upcoming = [];
  const past = [];
  events.forEach((event) => {
    if (new Date(event.startsAt).getTime() >= now) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  });
  upcoming.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  past.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  return [...upcoming, ...past];
}

export { sortEventsForAttendance };
