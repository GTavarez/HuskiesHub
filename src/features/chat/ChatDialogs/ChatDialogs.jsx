import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSeenBy } from "../../../api/chat.js";

function Dialog({ title, onClose, children }) {
  return (
    <div className="chat-dialog__overlay" onClick={onClose}>
      <div
        className="chat-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="chat-dialog__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 className="chat-dialog__title">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// Who has opened the chat since a message was sent, and who hasn't.
function SeenByDialog({ room, message, token, onClose }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["chatSeen", message._id],
    queryFn: () => getSeenBy(room, message._id, token),
    retry: false,
  });

  return (
    <Dialog title="Seen by" onClose={onClose}>
      {isLoading && <p className="chat-dialog__hint">Loading…</p>}
      {isError && <p className="chat-dialog__hint">{error?.message || "Couldn't load this."}</p>}
      {data && (
        <>
          <p className="chat-dialog__hint">
            {data.seen.length} of {data.total} have opened this chat since it was sent.
          </p>
          <h4 className="chat-dialog__subtitle">Seen ({data.seen.length})</h4>
          <ul className="chat-dialog__list">
            {data.seen.length === 0 && <li className="chat-dialog__empty">No one yet</li>}
            {data.seen.map((person) => (
              <li key={person._id}>{person.label}</li>
            ))}
          </ul>
          <h4 className="chat-dialog__subtitle">Not yet ({data.notSeen.length})</h4>
          <ul className="chat-dialog__list">
            {data.notSeen.length === 0 && <li className="chat-dialog__empty">Everyone has seen it</li>}
            {data.notSeen.map((person) => (
              <li key={person._id}>{person.label}</li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}

// Asks why, then hands the reason to `onSubmit`. Admins review reports; the
// person who sent the message isn't told who reported it.
function ReportDialog({ message, onSubmit, onClose }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const ok = await onSubmit(reason.trim());
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Dialog title="Report this message" onClose={onClose}>
      <p className="chat-dialog__hint">
        An admin will review it. {message.senderName} won't be told who reported it.
      </p>
      <blockquote className="chat-dialog__quote">{message.text || "Photo"}</blockquote>
      <label className="chat-dialog__label" htmlFor="chat-report-reason">
        What's wrong? (optional)
      </label>
      <textarea
        id="chat-report-reason"
        className="chat-dialog__textarea"
        value={reason}
        maxLength={500}
        rows={3}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="chat-dialog__actions">
        <button type="button" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="chat-dialog__primary" onClick={submit} disabled={busy}>
          {busy ? "Sending…" : "Report"}
        </button>
      </div>
    </Dialog>
  );
}

export { Dialog, SeenByDialog, ReportDialog };
