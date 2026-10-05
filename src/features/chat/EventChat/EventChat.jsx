import { useState } from "react";
import TeamChat from "../TeamChat/TeamChat.jsx";
import "./EventChat.css";

// The chat for one game or practice, in a window over the current page: carpool,
// "running late", "which field?", without cluttering the whole-team chat.
function EventChatModal({ eventId, title, onClose }) {
  return (
    <div className="event-chat__overlay" onClick={onClose}>
      <div
        className="event-chat"
        role="dialog"
        aria-modal="true"
        aria-label={`Chat for ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="event-chat__header">
          <div>
            <span className="event-chat__eyebrow">Event chat</span>
            <h3 className="event-chat__title">{title}</h3>
          </div>
          <button type="button" className="event-chat__close" onClick={onClose} aria-label="Close chat">
            ✕
          </button>
        </div>
        <div className="event-chat__body">
          <TeamChat eventId={eventId} />
        </div>
      </div>
    </div>
  );
}

function EventChatButton({ event }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="portal__link-button" onClick={() => setOpen(true)}>
        Chat
      </button>
      {open && <EventChatModal eventId={event._id} title={event.title} onClose={() => setOpen(false)} />}
    </>
  );
}

export { EventChatModal, EventChatButton };
export default EventChatButton;
