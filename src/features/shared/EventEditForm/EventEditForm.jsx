import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvent } from "../../../api/events.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";
import SuggestInput, { titleAfterOpponentChange } from "../SuggestInput/SuggestInput.jsx";

function toDatetimeLocalValue(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Inline edit form for one event — shared by the coach's Practice Plans and
// the admin Schedule panel, since both need the exact same fields/logic.
function EventEditForm({ event, teamId, token, onClose }) {
  const [title, setTitle] = useState(event.title);
  const [startsAt, setStartsAt] = useState(toDatetimeLocalValue(event.startsAt));
  const [endsAt, setEndsAt] = useState(toDatetimeLocalValue(event.endsAt));
  const [location, setLocation] = useState(event.location || "");
  const [opponent, setOpponent] = useState(event.opponent || "");
  const isGame = event.type === "game";
  const [notifyTeam, setNotifyTeam] = useState(true);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (payload) => updateEvent(event._id, payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events(teamId) });
      queryClient.invalidateQueries({ queryKey: ["savedOptions"] });
      pushToast({ type: "success", message: "Event updated." });
      onClose();
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to update event." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !startsAt || !endsAt) {
      pushToast({ type: "error", message: "Title, start, and end are required." });
      return;
    }
    updateMutation.mutate({
      title,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      location,
      ...(isGame ? { opponent } : {}),
      notifyTeam,
    });
  };

  return (
    <form className="portal__form" onSubmit={handleSubmit} style={{ marginTop: 8 }}>
      {isGame && (
        <SuggestInput
          kind="opponent"
          teamId={teamId}
          token={token}
          className="portal__input"
          value={opponent}
          onChange={(e) => {
            const next = e.target.value;
            setTitle((prev) => titleAfterOpponentChange(prev, opponent, next));
            setOpponent(next);
          }}
          placeholder="Opponent (pick or type)"
        />
      )}
      <input
        className="portal__input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <div className="portal__row" style={{ gap: 8 }}>
        <input
          className="portal__input"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <input
          className="portal__input"
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
        />
      </div>
      <SuggestInput
        kind="location"
        token={token}
        className="portal__input"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location (pick or type)"
      />
      <label className="portal__checkbox-row">
        <input
          type="checkbox"
          checked={notifyTeam}
          onChange={(e) => setNotifyTeam(e.target.checked)}
        />
        Email the team about this change
      </label>
      <div className="portal__row" style={{ gap: 8, justifyContent: "flex-start" }}>
        <button type="submit" className="portal__button" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
        <button type="button" className="portal__link-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default EventEditForm;
