import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMessage,
  editMessage,
  getPinned,
  getRoomInfo,
  getRoomMembers,
  markRoomRead,
  muteRoom,
  pinMessage,
  reactToMessage,
  reportMessage,
  unpinMessage,
  updateRoomSettings,
} from "../../../api/chat.js";
import { sendChatPhoto } from "../../../api/messages.js";
import { queryKeys } from "../../../api/queryKeys.js";
import CurrentUserContext from "../../../context/CurrentUserContext.js";
import { useToast } from "../../../context/ToastContext.js";
import { layoutMessages, muteLabel } from "../../../utils/chatText.js";
import { useChatRoom } from "../useChatRoom.js";
import MessageBubble from "../MessageBubble/MessageBubble.jsx";
import Composer from "../Composer/Composer.jsx";
import PinnedBar from "../PinnedBar/PinnedBar.jsx";
import PushBanner from "../PushBanner/PushBanner.jsx";
import { ReportDialog, SeenByDialog } from "../ChatDialogs/ChatDialogs.jsx";
import "./TeamChat.css";

const NEAR_BOTTOM_PX = 120;

const MUTE_CHOICES = [
  { label: "1 hour", options: { minutes: 60 } },
  { label: "8 hours", options: { minutes: 8 * 60 } },
  { label: "1 week", options: { minutes: 7 * 24 * 60 } },
  { label: "Until I turn it back on", options: { forever: true } },
];

// One chat: the whole-team room, a group or private message, or the chat for a
// single game. Which one is decided by whichever of teamId, conversationId or
// eventId is given. `onManage` opens people management for a group.
function TeamChat({ teamId, conversationId, eventId, onManage }) {
  const token = localStorage.getItem("jwt");
  const currentUser = useContext(CurrentUserContext);
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const room = useMemo(() => {
    if (conversationId) return { conversationId };
    if (eventId) return { eventId };
    return { teamId };
  }, [teamId, conversationId, eventId]);

  const chat = useChatRoom(room, token);
  const { roomKey, messages } = chat;
  const enabled = Boolean(token);

  const { data: info } = useQuery({
    queryKey: queryKeys.chatRoom(roomKey),
    queryFn: () => getRoomInfo(room, token),
    enabled,
    staleTime: 0,
  });
  const { data: members = [] } = useQuery({
    queryKey: queryKeys.chatMembers(roomKey),
    queryFn: () => getRoomMembers(room, token),
    enabled,
    staleTime: 60 * 1000,
  });
  const { data: pinned = [] } = useQuery({
    queryKey: queryKeys.chatPinned(roomKey),
    queryFn: () => getPinned(room, token),
    enabled,
    staleTime: 0,
  });

  const [replyTo, setReplyTo] = useState(null);
  const [seenFor, setSeenFor] = useState(null);
  const [reportFor, setReportFor] = useState(null);
  const [menu, setMenu] = useState(null); // "mute" | null
  const [newBelow, setNewBelow] = useState(false);
  const listRef = useRef(null);
  const atBottom = useRef(true);
  const firstScroll = useRef(true);
  const lastId = useRef(null);

  const currentUserId = currentUser?._id;
  const moderator = Boolean(info?.moderator);
  const memberNames = useMemo(
    () => [...members.map((m) => m.name), currentUser?.name].filter(Boolean),
    [members, currentUser?.name]
  );

  const refreshOverview = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["chatSummary"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(roomKey) });
  }, [queryClient, roomKey]);

  // ---------- keeping the list scrolled sensibly ----------

  const scrollToBottom = useCallback((smooth) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setNewBelow(false);
  }, []);

  useLayoutEffect(() => {
    if (chat.isLoading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (firstScroll.current) {
      firstScroll.current = false;
      lastId.current = last._id;
      scrollToBottom(false);
      return;
    }
    if (last._id === lastId.current) return; // an update, or older messages added
    lastId.current = last._id;
    if (atBottom.current || String(last.senderId) === String(currentUserId)) scrollToBottom(true);
    else setNewBelow(true);
  }, [messages, chat.isLoading, currentUserId, scrollToBottom]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (atBottom.current) setNewBelow(false);
  };

  const loadEarlier = async () => {
    const el = listRef.current;
    const before = el ? { height: el.scrollHeight, top: el.scrollTop } : null;
    await chat.loadEarlier();
    // Keep what the person was reading in place after older messages appear above it.
    requestAnimationFrame(() => {
      if (el && before) el.scrollTop = el.scrollHeight - before.height + before.top;
    });
  };

  const jumpTo = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) {
      pushToast({ type: "success", message: "That message is further back. Scroll up to load older ones." });
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("chat-msg--flash");
    setTimeout(() => el.classList.remove("chat-msg--flash"), 1300);
  };

  // ---------- read state ----------

  const lastMessageId = messages.length ? messages[messages.length - 1]._id : null;
  useEffect(() => {
    if (!token || !lastMessageId) return undefined;
    const mark = () => {
      if (document.visibilityState !== "visible") return;
      markRoomRead(room, token)
        .then(() => queryClient.invalidateQueries({ queryKey: ["chatSummary"] }))
        .catch(() => {});
    };
    const timer = setTimeout(mark, 400);
    window.addEventListener("focus", mark);
    document.addEventListener("visibilitychange", mark);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", mark);
      document.removeEventListener("visibilitychange", mark);
    };
    // `room` is described by roomKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, lastMessageId, roomKey, queryClient]);

  // ---------- actions ----------

  const run = async (action, failure) => {
    try {
      return await action();
    } catch (err) {
      pushToast({ type: "error", message: err?.message || failure });
      return null;
    }
  };

  const handleReact = (id, emoji) => run(() => reactToMessage(id, emoji, token), "Couldn't react.");

  const handleEdit = async (id, text) => Boolean(await run(() => editMessage(id, text, token), "Couldn't edit that message."));

  const handleDelete = async (message) => {
    const own = String(message.senderId) === String(currentUserId);
    const question = own ? "Delete this message?" : "Remove this message for everyone?";
    if (!window.confirm(question)) return;
    await run(() => deleteMessage(message._id, token), "Couldn't delete that message.");
  };

  const handlePin = (message) =>
    run(
      () => (message.pinnedAt ? unpinMessage(message._id, token) : pinMessage(message._id, token)),
      "Couldn't change the pin."
    );

  const handleReport = async (reason) => {
    const result = await run(() => reportMessage(reportFor._id, reason, token), "Couldn't send the report.");
    if (result) pushToast({ type: "success", message: "Thanks. An admin will take a look." });
    return Boolean(result);
  };

  const handleSendPhoto = async ({ file, text, replyToId }) => {
    const result = await run(
      () => sendChatPhoto({ ...room, file, text, replyToId }, token),
      "Couldn't send the photo."
    );
    return Boolean(result);
  };

  const handleMute = async (options) => {
    setMenu(null);
    await run(() => muteRoom(room, options, token), "Couldn't change notifications.");
    refreshOverview();
  };

  const toggleAnnouncementOnly = async () => {
    setMenu(null);
    await run(
      () => updateRoomSettings(room, { announcementOnly: !info?.announcementOnly }, token),
      "Couldn't change that setting."
    );
    refreshOverview();
  };

  // ---------- render ----------

  const rows = useMemo(() => layoutMessages(messages), [messages]);
  const mutedText = muteLabel(info?.mutedUntil);
  const canPost = info ? info.canPost : true;

  return (
    <div className="team-chat">
      <div className="team-chat__header">
        <div className="team-chat__title">
          <span className="team-chat__title-text">{info?.label || "Chat"}</span>
          {info?.announcementOnly && <span className="team-chat__tag">Announcements only</span>}
          {!chat.connected && <span className="team-chat__status">Connecting…</span>}
        </div>
        <div className="team-chat__header-actions">
          {onManage && info?.type === "group" && moderator && (
            <button type="button" className="team-chat__header-btn" onClick={onManage}>
              People
            </button>
          )}
          {moderator && info?.type !== "direct" && (
            <button type="button" className="team-chat__header-btn" onClick={toggleAnnouncementOnly}>
              {info?.announcementOnly ? "Allow replies" : "Announcements only"}
            </button>
          )}
          <div className="team-chat__menu-wrap">
            <button
              type="button"
              className="team-chat__header-btn"
              onClick={() => setMenu(menu === "mute" ? null : "mute")}
              aria-expanded={menu === "mute"}
              title="Notification settings for this chat"
            >
              {mutedText ? `🔕 ${mutedText}` : "🔔"}
            </button>
            {menu === "mute" && (
              <div className="team-chat__menu" role="menu">
                <p className="team-chat__menu-title">Mute this chat</p>
                {MUTE_CHOICES.map((choice) => (
                  <button key={choice.label} type="button" role="menuitem" onClick={() => handleMute(choice.options)}>
                    {choice.label}
                  </button>
                ))}
                {mutedText && (
                  <button type="button" role="menuitem" onClick={() => handleMute({ unmute: true })}>
                    Turn notifications back on
                  </button>
                )}
                <p className="team-chat__menu-note">You're still notified when someone @mentions you.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PushBanner token={token} />
      <PinnedBar pinned={pinned} onJumpTo={jumpTo} />

      {chat.isError && (
        <p className="team-chat__error">{chat.error?.message || "Failed to load messages."}</p>
      )}

      <div className="team-chat__messages" ref={listRef} onScroll={handleScroll}>
        {chat.hasMore && messages.length > 0 && (
          <button type="button" className="team-chat__earlier" onClick={loadEarlier} disabled={chat.loadingMore}>
            {chat.loadingMore ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {chat.isLoading && <p className="team-chat__empty">Loading messages…</p>}
        {!chat.isLoading && messages.length === 0 && (
          <p className="team-chat__empty">No messages yet. Say hello!</p>
        )}
        {rows.map((row) =>
          row.type === "day" ? (
            <div key={row.key} className="team-chat__day">
              <span>{row.label}</span>
            </div>
          ) : (
            <MessageBubble
              key={row.key}
              message={row.message}
              isMine={String(row.message.senderId) === String(currentUserId)}
              currentUserId={currentUserId}
              showHeader={!row.continues}
              memberNames={memberNames}
              token={token}
              canModerate={moderator}
              mentionedMe={(row.message.mentions || []).some((id) => String(id) === String(currentUserId))}
              onReply={setReplyTo}
              onReact={handleReact}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPin={handlePin}
              onSeenBy={setSeenFor}
              onReport={setReportFor}
              onJumpTo={jumpTo}
            />
          )
        )}
        {chat.typingNames.length > 0 && (
          <p className="team-chat__typing">
            {chat.typingNames.slice(0, 2).join(" and ")} {chat.typingNames.length > 1 ? "are" : "is"} typing…
          </p>
        )}
      </div>

      {newBelow && (
        <button type="button" className="team-chat__new-pill" onClick={() => scrollToBottom(true)}>
          New messages ↓
        </button>
      )}

      <Composer
        members={members}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        canPost={canPost}
        lockedMessage="Only coaches and admins can post in this chat."
        canUrgent={moderator}
        canFlag={currentUser?.role === "parent" && (info?.type === "team" || info?.type === "event")}
        onSend={chat.send}
        onSendPhoto={handleSendPhoto}
        onTyping={chat.notifyTyping}
      />

      {seenFor && <SeenByDialog room={room} message={seenFor} token={token} onClose={() => setSeenFor(null)} />}
      {reportFor && (
        <ReportDialog message={reportFor} onSubmit={handleReport} onClose={() => setReportFor(null)} />
      )}
    </div>
  );
}

export default TeamChat;
