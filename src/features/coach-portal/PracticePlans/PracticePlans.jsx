import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEvents, createEvent, cancelEvent } from "../../../api/events.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import { sortEventsForAttendance } from "../../../utils/eventSort.js";
import EventEditForm from "../../shared/EventEditForm/EventEditForm.jsx";
import SuggestInput, { titleAfterOpponentChange } from "../../shared/SuggestInput/SuggestInput.jsx";

const EMPTY_FORM = {
  type: "practice",
  title: "",
  startsAt: "",
  endsAt: "",
  location: "",
  opponent: "",
  notifyTeam: true,
};

// Coaches can add, edit, and cancel any event on their own team — including
// ones an admin or another coach posted, not just ones they created
// themselves. Hard delete stays admin-only (see AdminDashboard's Schedule
// tab), the one action still not available here.
function PracticePlans({ teamId, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingEventId, setEditingEventId] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: queryKeys.events(teamId),
    queryFn: () => getEvents(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createEvent(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events(teamId) });
      queryClient.invalidateQueries({ queryKey: ["savedOptions"] });
      pushToast({ type: "success", message: "Practice plan saved." });
      setForm(EMPTY_FORM);
    },
    onError: (error) => {
      pushToast({
        type: "error",
        message: error?.message || "Failed to save practice plan.",
      });
    },
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const toggleNotify = (e) => setForm((prev) => ({ ...prev, notifyTeam: e.target.checked }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.startsAt || !form.endsAt) {
      pushToast({ type: "error", message: "Title, start, and end are required." });
      return;
    }
    createMutation.mutate({
      ...form,
      teamId,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    });
  };

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
    const notifyTeam = window.confirm("Also email the team to let them know it's cancelled?");
    cancelMutation.mutate({ eventId: event._id, notifyTeam });
  };

  const handleCopy = (event) => {
    setForm({
      type: event.type,
      title: event.title,
      startsAt: "",
      endsAt: "",
      location: event.location || "",
      opponent: event.opponent || "",
      notifyTeam: true,
    });
    pushToast({
      type: "success",
      message: `Copied "${event.title}" — pick new times and save.`,
    });
  };

  return (
    <div>
      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="practice-type">
          Type
        </label>
        <select
          id="practice-type"
          className="portal__select"
          value={form.type}
          onChange={handleChange("type")}
        >
          <option value="practice">Practice</option>
          <option value="game">Game</option>
          <option value="lesson">Lesson</option>
        </select>

        {form.type === "game" && (
          <>
            <label className="portal__label" htmlFor="practice-opponent">
              Opponent
            </label>
            <SuggestInput
              id="practice-opponent"
              kind="opponent"
              teamId={teamId}
              token={token}
              className="portal__input"
              value={form.opponent}
              onChange={(e) => {
                const next = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  opponent: next,
                  title: titleAfterOpponentChange(prev.title, prev.opponent, next),
                }));
              }}
              placeholder="Pick a past opponent or type a new one"
            />
          </>
        )}

        <label className="portal__label" htmlFor="practice-title">
          Title
        </label>
        <input
          id="practice-title"
          className="portal__input"
          value={form.title}
          onChange={handleChange("title")}
          placeholder="e.g. Batting cages session"
        />

        <label className="portal__label" htmlFor="practice-starts">
          Starts
        </label>
        <input
          id="practice-starts"
          className="portal__input"
          type="datetime-local"
          value={form.startsAt}
          onChange={handleChange("startsAt")}
        />

        <label className="portal__label" htmlFor="practice-ends">
          Ends
        </label>
        <input
          id="practice-ends"
          className="portal__input"
          type="datetime-local"
          value={form.endsAt}
          onChange={handleChange("endsAt")}
        />

        <label className="portal__label" htmlFor="practice-location">
          Location
        </label>
        <SuggestInput
          id="practice-location"
          kind="location"
          token={token}
          className="portal__input"
          value={form.location}
          onChange={handleChange("location")}
          placeholder="Pick a saved field or type a new location"
        />

        <label className="portal__checkbox-row">
          <input type="checkbox" checked={form.notifyTeam} onChange={toggleNotify} />
          Email the team about this
        </label>

        <button
          type="submit"
          className="portal__button"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Saving..." : "Save Practice Plan"}
        </button>
      </form>

      <h3 className="portal__section-title">Upcoming</h3>
      {events.length === 0 && <p className="portal__empty">No events scheduled yet.</p>}
      {sortEventsForAttendance(events).map((event) => (
        <div key={event._id} className="portal__card">
          <div className="portal__card--row">
            <div>
              <span className={`portal__badge portal__badge--${event.type}`}>
                {event.type}
              </span>{" "}
              {event.status === "cancelled" && (
                <span className="portal__badge" style={{ background: "rgba(229, 115, 115, 0.25)", color: "#e57373" }}>
                  cancelled
                </span>
              )}{" "}
              <strong>{event.title}</strong>
              <p className="portal__card-meta">
                {new Date(event.startsAt).toLocaleString()}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            <div>
              <button
                type="button"
                className="portal__link-button"
                onClick={() => handleCopy(event)}
              >
                Copy
              </button>
              {event.status !== "cancelled" && (
                <>
                  <button
                    type="button"
                    className="portal__link-button"
                    style={{ marginLeft: 12 }}
                    onClick={() =>
                      setEditingEventId(editingEventId === event._id ? null : event._id)
                    }
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="portal__link-button"
                    style={{ marginLeft: 12 }}
                    disabled={cancelMutation.isPending}
                    onClick={() => handleCancel(event)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
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
  );
}

export default PracticePlans;
