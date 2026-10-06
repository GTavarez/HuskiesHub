import { useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "../../../utils/media.js";
import { segmentMessage, timeLabel } from "../../../utils/chatText.js";
import ChatPhoto from "../ChatPhoto/ChatPhoto.jsx";
import "./MessageBubble.css";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🙏", "🥎"];
const ROLE_BADGES = { coach: "Coach", admin: "Admin" };

function Avatar({ message }) {
  const url = message.senderAvatar ? resolveMediaUrl(message.senderAvatar) : "";
  if (url) return <img className="chat-msg__avatar" src={url} alt="" />;
  return (
    <span className="chat-msg__avatar chat-msg__avatar--initial" aria-hidden="true">
      {(message.senderName || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function MessageText({ text, memberNames }) {
  return segmentMessage(text, memberNames).map((segment, index) => {
    const key = `${segment.type}-${index}`;
    if (segment.type === "link") {
      return (
        <a key={key} href={segment.value} target="_blank" rel="noreferrer noopener" className="chat-msg__link">
          {segment.value}
        </a>
      );
    }
    if (segment.type === "mention") {
      return (
        <span key={key} className="chat-msg__mention">
          {segment.value}
        </span>
      );
    }
    return <span key={key}>{segment.value}</span>;
  });
}

// One message: who said it and when, the text (links and @mentions picked out),
// a quoted reply, a photo, reactions, and a menu of things you can do with it.
function MessageBubble({
  message,
  isMine,
  currentUserId,
  showHeader,
  memberNames,
  token,
  canModerate,
  mentionedMe,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onSeenBy,
  onReport,
  onJumpTo,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [menuOpen]);

  const deleted = Boolean(message.deletedAt);
  const classes = [
    "team-chat__message",
    "chat-msg",
    isMine ? "mine" : "theirs",
    showHeader ? "chat-msg--first" : "chat-msg--continued",
    mentionedMe ? "chat-msg--mentioned" : "",
    message.urgent || message.flagged ? "chat-msg--urgent" : "",
    deleted ? "chat-msg--deleted" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const act = (fn) => () => {
    setMenuOpen(false);
    fn();
  };

  const startEdit = () => {
    setDraft(message.text);
    setEditing(true);
  };

  const saveEdit = async () => {
    const text = draft.trim();
    if (!text || text === message.text) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onEdit(message._id, text);
    setSaving(false);
    if (ok) setEditing(false);
  };

  const reactions = (message.reactions || []).filter((r) => r.userIds.length > 0);

  return (
    <div className={classes} data-message-id={message._id} id={`msg-${message._id}`}>
      <div className="chat-msg__gutter">{showHeader ? <Avatar message={message} /> : null}</div>

      <div className="chat-msg__main">
        {showHeader && (
          <div className="chat-msg__meta">
            <strong className="chat-msg__name">{message.senderName}</strong>
            {ROLE_BADGES[message.senderRole] && (
              <span className="chat-msg__role">{ROLE_BADGES[message.senderRole]}</span>
            )}
            <span className="chat-msg__time">{timeLabel(message.createdAt)}</span>
          </div>
        )}

        {deleted ? (
          <p className="chat-msg__deleted">This message was deleted.</p>
        ) : (
          <>
            {message.urgent && <span className="chat-msg__urgent">Urgent</span>}
            {message.flagged && !message.urgent && <span className="chat-msg__urgent">Flagged for staff</span>}

            {message.replyTo?.messageId && (
              <button
                type="button"
                className="chat-msg__quote"
                onClick={() => onJumpTo(message.replyTo.messageId)}
              >
                <strong>{message.replyTo.senderName}</strong>
                <span>{message.replyTo.text || (message.replyTo.hasImage ? "Photo" : "")}</span>
              </button>
            )}

            {editing ? (
              <div className="chat-msg__edit">
                <textarea
                  className="chat-msg__edit-input"
                  value={draft}
                  maxLength={2000}
                  rows={2}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit();
                    }
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
                <div className="chat-msg__edit-actions">
                  <button type="button" onClick={saveEdit} disabled={saving}>
                    Save
                  </button>
                  <button type="button" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              message.text && (
                <p className="chat-msg__text">
                  <MessageText text={message.text} memberNames={memberNames} />
                </p>
              )
            )}

            {message.imageId && <ChatPhoto messageId={message._id} token={token} />}

            {reactions.length > 0 && (
              <div className="chat-msg__reactions">
                {reactions.map((reaction) => {
                  const mine = reaction.userIds.some((id) => String(id) === String(currentUserId));
                  return (
                    <button
                      key={reaction.emoji}
                      type="button"
                      className={`chat-msg__reaction${mine ? " chat-msg__reaction--mine" : ""}`}
                      onClick={() => onReact(message._id, reaction.emoji)}
                      aria-label={`${reaction.emoji} ${reaction.userIds.length}`}
                    >
                      <span>{reaction.emoji}</span>
                      <span>{reaction.userIds.length}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="chat-msg__foot">
              {!showHeader && <span className="chat-msg__time chat-msg__time--inline">{timeLabel(message.createdAt)}</span>}
              {message.editedAt && <span className="chat-msg__edited">edited</span>}
              {message.pinnedAt && <span className="chat-msg__pinned">📌 Pinned</span>}
            </div>
          </>
        )}
      </div>

      {!deleted && !editing && (
        <div className="chat-msg__actions" ref={menuRef}>
          <button
            type="button"
            className="chat-msg__more"
            aria-label="Message options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="chat-msg__menu" role="menu">
              <div className="chat-msg__menu-reactions">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`React ${emoji}`}
                    onClick={act(() => onReact(message._id, emoji))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button type="button" role="menuitem" onClick={act(() => onReply(message))}>
                Reply
              </button>
              {isMine && message.text && (
                <button type="button" role="menuitem" onClick={act(startEdit)}>
                  Edit
                </button>
              )}
              {canModerate && (
                <button type="button" role="menuitem" onClick={act(() => onPin(message))}>
                  {message.pinnedAt ? "Unpin" : "Pin to top"}
                </button>
              )}
              {(isMine || canModerate) && (
                <button type="button" role="menuitem" onClick={act(() => onSeenBy(message))}>
                  Seen by
                </button>
              )}
              {message.text && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={act(() => navigator.clipboard?.writeText(message.text))}
                >
                  Copy text
                </button>
              )}
              {(isMine || canModerate) && (
                <button
                  type="button"
                  role="menuitem"
                  className="chat-msg__menu-danger"
                  onClick={act(() => onDelete(message))}
                >
                  Delete
                </button>
              )}
              {!isMine && (
                <button type="button" role="menuitem" onClick={act(() => onReport(message))}>
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
