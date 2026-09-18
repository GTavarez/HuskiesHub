import RsvpControl from "../../../parent-portal/RsvpControl/RsvpControl.jsx";
import "./EventCard.css";

function EventCard({ event, currentUser, token, queryTeamId, onClose }) {
  // window.open must run synchronously inside the click handler — browsers
  // only allow a popup as a direct response to a user gesture. Waiting on
  // navigator.geolocation.getCurrentPosition() first (which is async) broke
  // that chain, so the browser silently blocked the popup with no visible
  // error. Omitting "origin" isn't a loss either — Google Maps already uses
  // the device's current location as the starting point automatically.
  const handleGetDirections = () => {
    const destination = encodeURIComponent(event.location);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank");
  };

  return (
    <div className="event-card__overlay" onClick={onClose}>
      <div className="event-card__content" onClick={(e) => e.stopPropagation()}>
        <button className="event-card__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className={`event-card__badge event-card__badge--${event.type}`}>
          {event.type}
        </span>
        {event.status === "cancelled" && (
          <span
            className="event-card__badge"
            style={{ background: "rgba(229, 115, 115, 0.25)", color: "#e57373" }}
          >
            cancelled
          </span>
        )}
        <h2 className="event-card__title">{event.title}</h2>
        <p className="event-card__meta">{new Date(event.startsAt).toLocaleString()}</p>
        {event.location && (
          <>
            <p className="event-card__meta">{event.location}</p>
            <iframe
              title="Event location map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: 10, marginTop: 8 }}
              loading="lazy"
            ></iframe>
            <button
              type="button"
              className="event-card__directions-btn"
              onClick={handleGetDirections}
            >
              🚗 Get Directions
            </button>
          </>
        )}

        {event.status === "cancelled" ? (
          <p className="event-card__login-hint">This event has been cancelled.</p>
        ) : currentUser ? (
          <div className="event-card__rsvp">
            <p className="event-card__rsvp-label">Will you be there?</p>
            <RsvpControl
              event={event}
              currentUserId={currentUser._id}
              token={token}
              teamId={queryTeamId}
            />
          </div>
        ) : (
          <p className="event-card__login-hint">Log in to confirm your attendance.</p>
        )}
      </div>
    </div>
  );
}

export default EventCard;
