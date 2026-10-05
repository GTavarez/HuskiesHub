import { useState } from "react";
import "./PinnedBar.css";

// The messages coaches pinned, kept at the top of the chat. Shows the newest
// one; tap to see them all, tap one to jump to it.
function PinnedBar({ pinned, onJumpTo }) {
  const [open, setOpen] = useState(false);
  if (!pinned || pinned.length === 0) return null;

  const latest = pinned[0];
  return (
    <div className="pinned-bar">
      <div className="pinned-bar__row">
        <button
          type="button"
          className="pinned-bar__latest"
          onClick={() => onJumpTo(latest._id)}
          aria-label="Go to pinned message"
        >
          <span aria-hidden="true">📌</span>
          <span className="pinned-bar__text">
            <strong>{latest.senderName}:</strong> {latest.text || "Photo"}
          </span>
        </button>
        {pinned.length > 1 && (
          <button type="button" className="pinned-bar__toggle" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : `All ${pinned.length}`}
          </button>
        )}
      </div>
      {open && (
        <ul className="pinned-bar__list">
          {pinned.map((message) => (
            <li key={message._id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onJumpTo(message._id);
                }}
              >
                <strong>{message.senderName}:</strong> {message.text || "Photo"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PinnedBar;
