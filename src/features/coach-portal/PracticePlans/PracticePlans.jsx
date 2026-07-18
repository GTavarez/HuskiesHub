import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEvents, createEvent } from "../../../api/events.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const EMPTY_FORM = {
  type: "practice",
  title: "",
  startsAt: "",
  endsAt: "",
  location: "",
};

function PracticePlans({ teamId, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: events = [] } = useQuery({
    queryKey: queryKeys.events(teamId),
    queryFn: () => getEvents(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createEvent(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events(teamId) });
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

  const handleCopy = (event) => {
    setForm({
      type: event.type,
      title: event.title,
      startsAt: "",
      endsAt: "",
      location: event.location || "",
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
        <input
          id="practice-location"
          className="portal__input"
          value={form.location}
          onChange={handleChange("location")}
          placeholder="e.g. Huskies Indoor Facility"
        />

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
      {events.map((event) => (
        <div key={event._id} className="portal__card portal__card--row">
          <div>
            <span className={`portal__badge portal__badge--${event.type}`}>
              {event.type}
            </span>{" "}
            <strong>{event.title}</strong>
            <p className="portal__card-meta">
              {new Date(event.startsAt).toLocaleString()}
              {event.location ? ` · ${event.location}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="portal__link-button"
            onClick={() => handleCopy(event)}
          >
            Copy
          </button>
        </div>
      ))}
    </div>
  );
}

export default PracticePlans;
