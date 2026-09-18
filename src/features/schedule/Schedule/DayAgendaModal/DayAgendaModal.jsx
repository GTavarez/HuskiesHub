import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeams } from "../../../../api/teams.js";
import { createEvent, deleteEvent } from "../../../../api/events.js";
import { queryKeys } from "../../../../api/queryKeys.js";
import { useToast } from "../../../../context/ToastContext.js";
import "./DayAgendaModal.css";

const EMPTY_FORM = {
  type: "practice",
  teamId: "",
  title: "",
  startTime: "17:00",
  endTime: "19:00",
  location: "",
  notifyTeam: true,
};

// Quick-add form for a new event on the clicked day — a lighter version of
// PracticePlans' create form, scoped to one date. Admins see a team picker
// since the day view spans every team at once; a coach's team is locked to
// their own (both in the UI and enforced again server-side), matching the
// same team-scoping already applied to announcements.
function AddEventForm({ date, token, lockedTeamId, lockedTeamName, onDone }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, teamId: lockedTeamId || "" });
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    enabled: !lockedTeamId,
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createEvent(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      pushToast({ type: "success", message: "Event added." });
      onDone();
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to add event." });
    },
  });

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const toggleNotify = (e) => setForm((prev) => ({ ...prev, notifyTeam: e.target.checked }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.teamId || !form.title) {
      pushToast({ type: "error", message: "Team and title are required." });
      return;
    }
    const dateStr = date.toISOString().slice(0, 10);
    createMutation.mutate({
      type: form.type,
      teamId: form.teamId,
      title: form.title,
      location: form.location,
      startsAt: new Date(`${dateStr}T${form.startTime}`).toISOString(),
      endsAt: new Date(`${dateStr}T${form.endTime}`).toISOString(),
      notifyTeam: form.notifyTeam,
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      {lockedTeamId ? (
        <p className="portal__card-meta">Adding to: {lockedTeamName || "your team"}</p>
      ) : (
        <select className="portal__select" value={form.teamId} onChange={handleChange("teamId")}>
          <option value="">Select a team…</option>
          {teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
      )}
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
          type="time"
          value={form.startTime}
          onChange={handleChange("startTime")}
        />
        <input
          className="portal__input"
          type="time"
          value={form.endTime}
          onChange={handleChange("endTime")}
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
        {createMutation.isPending ? "Adding..." : "Add to this day"}
      </button>
    </form>
  );
}

// All-day events (e.g. Google Calendar tournament entries with a date but no
// time) come through as a plain "YYYY-MM-DD" string — that represents an
// actual calendar date, not a UTC instant. Parsing it with `new Date(...)`
// and converting back to local time with `.toDateString()` can shift it a
// day in any timezone behind UTC, which is why some events wouldn't show up
// when clicking the day they're actually rendered on. Comparing everything
// as a local "YYYY-MM-DD" key sidesteps that.
function toLocalDateKey(input) {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  const d = new Date(input);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Shows everything happening on one calendar day — games and team events —
// with quick add right from the popup instead of making them jump to the
// Schedule admin tab or Coach Portal. Admins can add to any team and delete
// anything; a coach can add to their own team only, and can't edit/delete —
// same create-only boundary as everywhere else coaches touch the schedule.
function DayAgendaModal({
  date,
  games,
  teamEvents,
  isAdmin,
  coachTeamId,
  coachTeamName,
  token,
  onSelectTeamEvent,
  onSelectGame,
  onClose,
}) {
  const canAdd = isAdmin || Boolean(coachTeamId);
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const dateKey = toLocalDateKey(date);
  const dayGames = games.filter((g) => toLocalDateKey(g.start) === dateKey);
  const dayEvents = teamEvents.filter((e) => toLocalDateKey(e.startsAt) === dateKey);

  const deleteMutation = useMutation({
    mutationFn: (eventId) => deleteEvent(eventId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      pushToast({ type: "success", message: "Event deleted." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to delete event." });
    },
  });

  const handleDelete = (event) => {
    if (!window.confirm(`Permanently delete "${event.title}"? This can't be undone.`)) return;
    deleteMutation.mutate(event._id);
  };

  return (
    <div className="day-agenda__overlay" onClick={onClose}>
      <div className="day-agenda__content" onClick={(e) => e.stopPropagation()}>
        <button className="day-agenda__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="day-agenda__title">
          {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h2>

        {dayGames.length === 0 && dayEvents.length === 0 && (
          <p className="portal__empty">Nothing scheduled this day.</p>
        )}

        {dayGames.map((game) => (
          <div key={game.id} className="portal__card portal__card--row">
            <div onClick={() => onSelectGame(game)} style={{ cursor: "pointer" }}>
              <span className="portal__badge portal__badge--game">game</span>{" "}
              <strong>{game.title}</strong>
              <p className="portal__card-meta">{new Date(game.start).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}

        {dayEvents.map((event) => (
          <div key={event._id} className="portal__card portal__card--row">
            <div onClick={() => onSelectTeamEvent(event)} style={{ cursor: "pointer" }}>
              <span className={`portal__badge portal__badge--${event.type}`}>{event.type}</span>{" "}
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
                {new Date(event.startsAt).toLocaleTimeString()}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            {isAdmin && (
              <button
                type="button"
                className="portal__link-button"
                disabled={deleteMutation.isPending}
                onClick={() => handleDelete(event)}
              >
                Delete
              </button>
            )}
          </div>
        ))}

        {canAdd && (
          <>
            <button
              type="button"
              className="portal__button"
              style={{ marginTop: 16 }}
              onClick={() => setIsAdding((prev) => !prev)}
            >
              {isAdding ? "Cancel" : "Add event to this day"}
            </button>
            {isAdding && (
              <AddEventForm
                date={date}
                token={token}
                lockedTeamId={isAdmin ? null : coachTeamId}
                lockedTeamName={coachTeamName}
                onDone={() => setIsAdding(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DayAgendaModal;
