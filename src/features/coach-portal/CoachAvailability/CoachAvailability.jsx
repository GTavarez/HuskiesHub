import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../../../api/events.js";
import { getTeamContacts } from "../../../api/players.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { sortEventsForAttendance } from "../../../utils/eventSort.js";

const STATUS_LABELS = { yes: "Going", maybe: "Maybe", no: "Can't go" };

function CoachAvailability({ teamId, token }) {
  const { data: events = [] } = useQuery({
    queryKey: queryKeys.events(teamId),
    queryFn: () => getEvents(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: queryKeys.teamContacts(teamId),
    queryFn: () => getTeamContacts(teamId, token),
    enabled: Boolean(teamId && token),
  });

  // Attendance shows the player's name, not whichever account (parent or
  // player) actually submitted the RSVP.
  const nameById = useMemo(
    () => new Map(contacts.map((c) => [c._id, c.attendeeName || c.name])),
    [contacts]
  );

  const upcoming = useMemo(
    () => sortEventsForAttendance(events.filter((e) => e.status !== "cancelled")),
    [events]
  );

  return (
    <div>
      <h3 className="portal__section-title">Team Availability</h3>
      {upcoming.length === 0 && (
        <p className="portal__empty">No upcoming practices, games, lessons, or meetings yet.</p>
      )}
      {upcoming.map((event) => {
        const byStatus = { yes: [], no: [], maybe: [] };
        (event.rsvps || []).forEach((rsvp) => {
          const name = nameById.get(rsvp.userId) || nameById.get(String(rsvp.userId));
          if (byStatus[rsvp.status]) byStatus[rsvp.status].push(name || "Unknown");
        });

        return (
          <div key={event._id} className="portal__card">
            <div className="portal__card-header">
              <span className={`portal__badge portal__badge--${event.type}`}>{event.type}</span>
              <strong>{event.title}</strong>
            </div>
            <p className="portal__card-meta">
              {new Date(event.startsAt).toLocaleString()}
              {event.location ? ` · ${event.location}` : ""}
            </p>
            <div style={{ marginTop: 8, display: "flex", gap: 24, flexWrap: "wrap" }}>
              {Object.entries(STATUS_LABELS).map(([status, label]) => (
                <div key={status}>
                  <strong>
                    {label} ({byStatus[status].length})
                  </strong>
                  {byStatus[status].length > 0 && (
                    <p className="portal__card-meta">{byStatus[status].join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CoachAvailability;
