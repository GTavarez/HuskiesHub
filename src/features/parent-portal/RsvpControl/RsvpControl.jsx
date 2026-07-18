import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rsvpToEvent } from "../../../api/events.js";
import { queryKeys } from "../../../api/queryKeys.js";
import "./RsvpControl.css";

const LABELS = { yes: "Going", maybe: "Maybe", no: "Can't go" };

function RsvpControl({ event, currentUserId, token, teamId }) {
  const queryClient = useQueryClient();
  const myRsvp = event.rsvps?.find(
    (rsvp) => String(rsvp.userId) === String(currentUserId)
  );

  const rsvpMutation = useMutation({
    mutationFn: (status) => rsvpToEvent(event._id, status, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events(teamId) });
    },
  });

  return (
    <div className="rsvp-control">
      {Object.keys(LABELS).map((status) => (
        <button
          key={status}
          type="button"
          className={`rsvp-control__button rsvp-control__button--${status}${
            myRsvp?.status === status ? " rsvp-control__button--active" : ""
          }`}
          disabled={rsvpMutation.isPending}
          onClick={() => rsvpMutation.mutate(status)}
        >
          {LABELS[status]}
        </button>
      ))}
    </div>
  );
}

export default RsvpControl;
