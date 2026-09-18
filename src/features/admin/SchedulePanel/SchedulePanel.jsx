import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams.js";
import { getEvents, createEvent, cancelEvent } from "../../../api/events.js";
import { getTeamContacts } from "../../../api/players.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { sortEventsForAttendance } from "../../../utils/eventSort.js";
import { useToast } from "../../../context/ToastContext.js";
import EventEditForm from "../../shared/EventEditForm/EventEditForm.jsx";

const RSVP_LABELS = { yes: "Going", maybe: "Maybe", no: "Can't go" };

const EMPTY_NEW_EVENT = {
  type: "practice",
  title: "",
  startsAt: "",
  endsAt: "",
  location: "",
  notifyTeam: true,
};

// Admins previously had no way to add a new schedule entry from this panel —
// Edit/Cancel only worked on events that already existed, created elsewhere
// (a coach's Practice Plans, or the public Schedule page's day-click form).
// This closes that gap so the owner/admin can add or edit anything —
// practices, games, lessons, meetings — without needing a coach account or
// going outside the app to update a calendar by hand.
function CreateEventForm({ teamId, token, onCreated }) {
  const [form, setForm] = useState(EMPTY_NEW_EVENT);
  const { pushToast } = useToast();

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const toggleNotify = (e) => setForm((prev) => ({ ...prev, notifyTeam: e.target.checked }));

  const createMutation = useMutation({
    mutationFn: (payload) => createEvent(payload, token),
    onSuccess: () => {
      onCreated();
      setForm(EMPTY_NEW_EVENT);
      pushToast({ type: "success", message: "Event added." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add event." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startsAt || !form.endsAt) {
      pushToast({ type: "error", message: "Title, start, and end are required." });
      return;
    }
    createMutation.mutate({
      type: form.type,
      teamId,
      title: form.title.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      location: form.location,
      notifyTeam: form.notifyTeam,
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
      <h3 className="portal__section-title">Add to Schedule</h3>
      <select className="portal__select" value={form.type} onChange={handleChange("type")}>
        <option value="practice">Practice</option>
        <option value="game">Game</option>
        <option value="lesson">Lesson</option>
        <option value="meeting">Meeting</option>
      </select>
      <input
        className="portal__input"
        value={form.title}
        onChange={handleChange("title")}
        placeholder="Title"
      />
      <div className="portal__row" style={{ gap: 8 }}>
        <input
          className="portal__input"
          type="datetime-local"
          value={form.startsAt}
          onChange={handleChange("startsAt")}
        />
        <input
          className="portal__input"
          type="datetime-local"
          value={form.endsAt}
          onChange={handleChange("endsAt")}
        />
      </div>
      <input
        className="portal__input"
        value={form.location}
        onChange={handleChange("location")}
        placeholder="Location"
      />
      <label className="portal__checkbox-row">
        <input type="checkbox" checked={form.notifyTeam} onChange={toggleNotify} />
        Email the team about this
      </label>
      <button type="submit" className="portal__button" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Adding..." : "Add Event"}
      </button>
    </form>
  );
}

function SchedulePanel({ token }) {
  const [teamId, setTeamId] = useState("");
  const [editingEventId, setEditingEventId] = useState(null);
  const [availabilityEventId, setAvailabilityEventId] = useState(null);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    enabled: Boolean(token),
  });

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
    () => new Map(contacts.map((c) => [String(c._id), c.attendeeName || c.name])),
    [contacts]
  );

  const cancelMutation = useMutation({
    mutationFn: ({ eventId, notifyTeam }) => cancelEvent(eventId, notifyTeam, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events(teamId) });
      pushToast({ type: "success", message: "Event cancelled." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to cancel event." });
    },
  });

  const handleCancel = (event) => {
    if (!window.confirm(`Cancel "${event.title}" on ${new Date(event.startsAt).toLocaleString()}?`)) {
      return;
    }
    const notifyTeam = window.confirm(
      "Also email the team to let them know it's cancelled?"
    );
    cancelMutation.mutate({ eventId: event._id, notifyTeam });
  };

  const upcoming = sortEventsForAttendance(events);

  return (
    <div>
      <label className="portal__label" htmlFor="schedule-team">
        Team
      </label>
      <select
        id="schedule-team"
        className="portal__select"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      >
        <option value="">Select a team…</option>
        {teams.map((team) => (
          <option key={team._id} value={team._id}>
            {team.name}
          </option>
        ))}
      </select>

      {teamId && (
        <div style={{ marginTop: 16 }}>
          <CreateEventForm
            teamId={teamId}
            token={token}
            onCreated={() => queryClient.invalidateQueries({ queryKey: queryKeys.events(teamId) })}
          />
          {upcoming.length === 0 && (
            <p className="portal__empty">No practices, games, lessons, or meetings scheduled for this team.</p>
          )}
          {upcoming.map((event) => (
            <div key={event._id} className="portal__card">
              <div className="portal__card--row">
                <div>
                  <span className={`portal__badge portal__badge--${event.type}`}>
                    {event.type}
                  </span>{" "}
                  {event.status === "cancelled" && (
                    <span
                      className="portal__badge"
                      style={{ background: "rgba(229, 115, 115, 0.25)", color: "#e57373" }}
                    >
                      cancelled
                    </span>
                  )}{" "}
                  <strong>{event.title}</strong>
                  <p className="portal__card-meta">
                    {new Date(event.startsAt).toLocaleString()}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                {event.status !== "cancelled" && (
                  <div>
                    <button
                      type="button"
                      className="portal__link-button"
                      style={{ marginRight: 12 }}
                      onClick={() =>
                        setAvailabilityEventId(availabilityEventId === event._id ? null : event._id)
                      }
                    >
                      Attendance ({(event.rsvps || []).length})
                    </button>
                    <button
                      type="button"
                      className="portal__link-button"
                      style={{ marginRight: 12 }}
                      onClick={() =>
                        setEditingEventId(editingEventId === event._id ? null : event._id)
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="portal__link-button"
                      disabled={cancelMutation.isPending}
                      onClick={() => handleCancel(event)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {availabilityEventId === event._id && (
                <div style={{ marginTop: 8, display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {(() => {
                    const byStatus = { yes: [], no: [], maybe: [] };
                    (event.rsvps || []).forEach((rsvp) => {
                      const name = nameById.get(String(rsvp.userId));
                      if (byStatus[rsvp.status]) byStatus[rsvp.status].push(name || "Unknown");
                    });
                    const responded = new Set((event.rsvps || []).map((r) => String(r.userId)));
                    const notYetResponded = contacts
                      .filter((c) => !responded.has(String(c._id)))
                      .map((c) => c.name);
                    return (
                      <>
                        {Object.entries(RSVP_LABELS).map(([status, label]) => (
                          <div key={status}>
                            <strong>
                              {label} ({byStatus[status].length})
                            </strong>
                            {byStatus[status].length > 0 && (
                              <p className="portal__card-meta">{byStatus[status].join(", ")}</p>
                            )}
                          </div>
                        ))}
                        <div>
                          <strong>Not yet responded ({notYetResponded.length})</strong>
                          {notYetResponded.length > 0 && (
                            <p className="portal__card-meta">{notYetResponded.join(", ")}</p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              {editingEventId === event._id && (
                <EventEditForm
                  event={event}
                  teamId={teamId}
                  token={token}
                  onClose={() => setEditingEventId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SchedulePanel;
