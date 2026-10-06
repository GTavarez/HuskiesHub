import { useEffect, useRef, useState } from "react";
import { useToast } from "../../../context/ToastContext.js";
import "./Composer.css";

const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_LENGTH = 2000;
const TYPING_THROTTLE_MS = 2000;

// "@par" just before the cursor means the person is picking someone to mention.
// Names can have a space, so up to two words are allowed in the query.
const MENTION_AT_CURSOR = /(?:^|\s)@([^\s@]{0,30}(?: [^\s@]{0,30})?)$/;

function Composer({
  members,
  replyTo,
  onCancelReply,
  canPost,
  lockedMessage,
  canUrgent,
  canFlag,
  onSend,
  onSendPhoto,
  onTyping,
}) {
  const { pushToast } = useToast();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [urgent, setUrgent] = useState(false);
  const [flag, setFlag] = useState(false);
  const [sending, setSending] = useState(false);
  const [mentionIds, setMentionIds] = useState({}); // name -> user id
  const [mention, setMention] = useState(null); // { start, query }
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastTyping = useRef(0);

  // Replying focuses the box so the person can just start typing.
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const matches = mention
    ? members
        .filter((m) => m.name.toLowerCase().includes(mention.query.toLowerCase()))
        .slice(0, 6)
    : [];

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    const caret = e.target.selectionStart ?? value.length;
    const found = MENTION_AT_CURSOR.exec(value.slice(0, caret));
    setMention(found ? { start: caret - found[1].length - 1, query: found[1] } : null);
    setMentionIndex(0);

    const now = Date.now();
    if (value && now - lastTyping.current > TYPING_THROTTLE_MS) {
      lastTyping.current = now;
      onTyping();
    }
  };

  const pickMention = (member) => {
    if (!mention) return;
    const caret = textareaRef.current?.selectionStart ?? text.length;
    const inserted = `@${member.name} `;
    const next = text.slice(0, mention.start) + inserted + text.slice(caret);
    setText(next);
    setMentionIds((current) => ({ ...current, [member.name]: member._id }));
    setMention(null);
    const position = mention.start + inserted.length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(position, position);
    });
  };

  const reset = () => {
    setText("");
    setPhoto(null);
    setUrgent(false);
    setFlag(false);
    setMentionIds({});
    setMention(null);
    onCancelReply();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    if (sending) return;
    const body = text.trim();

    if (photo) {
      setSending(true);
      const ok = await onSendPhoto({ file: photo, text: body, replyToId: replyTo?._id });
      setSending(false);
      if (ok) reset();
      return;
    }
    if (!body) return;
    if (urgent && !window.confirm("Send this as urgent? It emails and notifies everyone in this chat right away.")) {
      return;
    }

    if (flag && !window.confirm("Flag this as urgent? The coaches and admins will be alerted right away.")) {
      return;
    }

    const mentions = Object.entries(mentionIds)
      .filter(([name]) => body.includes(`@${name}`))
      .map(([, id]) => id);
    setSending(true);
    const ack = await onSend({ text: body, replyToId: replyTo?._id, mentions, urgent, flag });
    setSending(false);
    if (ack.ok) reset();
    else pushToast({ type: "error", message: ack.error || "Couldn't send that message." });
  };

  const handleKeyDown = (e) => {
    if (matches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(matches[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMention(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handlePhotoPicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      pushToast({ type: "error", message: "That photo is too large (15 MB max)." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setPhoto(file);
  };

  if (!canPost) {
    return <div className="chat-composer chat-composer--locked">{lockedMessage}</div>;
  }

  const rows = Math.min(5, Math.max(1, text.split("\n").length));

  return (
    <div className="chat-composer">
      {replyTo && (
        <div className="chat-composer__reply">
          <div>
            <strong>Replying to {replyTo.senderName}</strong>
            <span>{replyTo.text || "Photo"}</span>
          </div>
          <button type="button" onClick={onCancelReply} aria-label="Cancel reply">
            ✕
          </button>
        </div>
      )}

      {photoPreview && (
        <div className="team-chat__attachment chat-composer__photo">
          <img src={photoPreview} alt="Photo to send" className="team-chat__attachment-img" />
          <button
            type="button"
            className="team-chat__attachment-remove"
            onClick={() => {
              setPhoto(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            disabled={sending}
            aria-label="Remove photo"
          >
            Remove
          </button>
        </div>
      )}

      {matches.length > 0 && (
        <ul className="chat-composer__mentions" role="listbox" aria-label="People to mention">
          {matches.map((member, index) => (
            <li key={member._id} role="option" aria-selected={index === mentionIndex}>
              <button
                type="button"
                className={index === mentionIndex ? "is-active" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickMention(member);
                }}
              >
                {member.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="team-chat__input chat-composer__row">
        <input
          ref={fileInputRef}
          type="file"
          accept={PHOTO_ACCEPT}
          onChange={handlePhotoPicked}
          hidden
          data-testid="chat-photo-input"
        />
        <button
          type="button"
          className="team-chat__attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          aria-label="Attach a photo"
          title="Attach a photo"
        >
          Photo
        </button>
        <textarea
          ref={textareaRef}
          className="chat-composer__input"
          value={text}
          rows={rows}
          maxLength={MAX_LENGTH}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={photo ? "Add a caption (optional)..." : "Type a message... (@ to mention)"}
          aria-label="Message"
        />
        <button type="button" className="chat-composer__send" onClick={submit} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </div>

      <div className="chat-composer__foot">
        {canUrgent && (
          <label className="chat-composer__urgent">
            <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
            Urgent (also emails everyone)
          </label>
        )}
        {canFlag && (
          <label className="chat-composer__urgent">
            <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} />
            Flag as urgent (alerts the coaches and admins right away)
          </label>
        )}
        {text.length > MAX_LENGTH - 200 && (
          <span className="chat-composer__count">
            {text.length}/{MAX_LENGTH}
          </span>
        )}
      </div>
    </div>
  );
}

export default Composer;
