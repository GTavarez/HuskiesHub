import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUpcomingNotifications } from "../../../api/notifications.js";
import { rsvpToEvent } from "../../../api/events.js";
import { queryKeys } from "../../../api/queryKeys.js";
import "./NotificationBell.css";

const REFRESH_MS = 5 * 60 * 1000;

function formatWhen(startsAt) {
  const date = new Date(startsAt);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NotificationBell({ token }) {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: upcoming = [] } = useQuery({
    queryKey: queryKeys.upcomingNotifications(),
    queryFn: () => getUpcomingNotifications(token),
    enabled: Boolean(token),
    refetchInterval: REFRESH_MS,
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }) => rsvpToEvent(eventId, status, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingNotifications() });
    },
  });

  React.useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const needsConfirmation = upcoming.filter(
    (item) => item.kind === "event" && item.myRsvp !== "yes"
  ).length;

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="notification-bell__button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Upcoming notifications"
      >
        <span className="notification-bell__icon" aria-hidden="true">
          🔔
        </span>
        {upcoming.length > 0 && (
          <span
            className={
              needsConfirmation > 0
                ? "notification-bell__badge notification-bell__badge--alert"
                : "notification-bell__badge"
            }
          >
            {upcoming.length}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <p className="notification-bell__panel-title">Upcoming (next 7 days)</p>
          {upcoming.length === 0 && (
            <p className="notification-bell__empty">Nothing coming up.</p>
          )}
          {upcoming.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="notification-bell__item">
              <div className="notification-bell__item-main">
                <span className="notification-bell__item-title">{item.title}</span>
                <span className="notification-bell__item-when">{formatWhen(item.startsAt)}</span>
                {item.location && (
                  <span className="notification-bell__item-location">{item.location}</span>
                )}
              </div>
              {item.kind === "event" && item.myRsvp !== "yes" && (
                <button
                  type="button"
                  className="notification-bell__confirm-btn"
                  disabled={rsvpMutation.isPending}
                  onClick={() => rsvpMutation.mutate({ eventId: item.id, status: "yes" })}
                >
                  Confirm attendance
                </button>
              )}
              {item.kind === "event" && item.myRsvp === "yes" && (
                <span className="notification-bell__confirmed">Confirmed</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
