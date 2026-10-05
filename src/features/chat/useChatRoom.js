import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoomMessages } from "../../api/chat.js";
import { queryKeys } from "../../api/queryKeys.js";
import { socketUrl } from "../../utils/config.js";
import { upsertMessage } from "../../utils/chatText.js";

const PAGE_SIZE = 50;
const CONNECT_WAIT_MS = 4000;

// Resolves true once the socket is connected, or false if it isn't within `ms`.
// Lets someone who types and sends right as the chat opens still get through.
function waitForConnection(socket, ms) {
  return new Promise((resolve) => {
    if (socket.connected) {
      resolve(true);
      return;
    }
    const onConnect = () => {
      clearTimeout(timer);
      resolve(true);
    };
    const timer = setTimeout(() => {
      socket.off("connect", onConnect);
      resolve(false);
    }, ms);
    socket.once("connect", onConnect);
  });
}
const TYPING_SHOWN_MS = 3000;

// "team:<id>" | "conv:<id>" | "event:<id>", matching the server's room keys.
function roomKeyOf(room) {
  if (room.conversationId) return `conv:${room.conversationId}`;
  if (room.eventId) return `event:${room.eventId}`;
  return `team:${room.teamId}`;
}

function messagesQueryKey(room) {
  if (room.conversationId) return queryKeys.conversationMessages(room.conversationId);
  if (room.eventId) return queryKeys.eventMessages(room.eventId);
  return queryKeys.messages(room.teamId);
}

const byTime = (a, b) => {
  const diff = new Date(a.createdAt) - new Date(b.createdAt);
  if (diff !== 0) return diff;
  return String(a._id).localeCompare(String(b._id));
};

// Combines two lists of messages by id, oldest to newest.
function mergeMessages(existing = [], incoming = []) {
  const byId = new Map();
  [...existing, ...incoming].forEach((m) => byId.set(m._id, m));
  return [...byId.values()].sort(byTime);
}

// One chat room, live: the latest messages, older ones on request, sending with
// an acknowledgement, and who is typing. `room` is { teamId } | { conversationId }
// | { eventId } and should be stable between renders.
function useChatRoom(room, token) {
  const queryClient = useQueryClient();
  const queryKey = messagesQueryKey(room);
  const roomKey = roomKeyOf(room);
  const socketRef = useRef(null);
  const typingTimers = useRef({});
  const hasConnectedBefore = useRef(false);
  const [connected, setConnected] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typing, setTyping] = useState({});

  const {
    data: messages = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const page = await getRoomMessages(room, token);
      const previous = queryClient.getQueryData(queryKey);
      // First load decides whether there is anything older; a refetch (after a
      // dropped connection) merges in the newest page without losing older
      // messages that were already loaded.
      if (!previous || previous.length === 0) setHasMore(page.length >= PAGE_SIZE);
      return mergeMessages(previous, page);
    },
    enabled: Boolean(token),
    // Always fetch when a chat is opened. The app caches most data for a minute,
    // which would hide messages that arrived while the person was in another chat.
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(socketUrl, { auth: { token, ...room } });
    socketRef.current = socket;
    const timers = typingTimers.current;

    const apply = (message) =>
      queryClient.setQueryData(queryKey, (previous) =>
        upsertMessage(Array.isArray(previous) ? previous : [], message)
      );
    const sendVisibility = () => socket.emit("visibility", document.visibilityState === "visible");

    socket.on("connect", () => {
      setConnected(true);
      // After a drop, anything sent meanwhile is fetched rather than lost.
      if (hasConnectedBefore.current) queryClient.invalidateQueries({ queryKey });
      hasConnectedBefore.current = true;
      sendVisibility();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("new-message", apply);
    socket.on("message-updated", (message) => {
      apply(message);
      queryClient.invalidateQueries({ queryKey: queryKeys.chatPinned(roomKey) });
    });
    socket.on("room-updated", () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatRoom(roomKey) });
    });
    socket.on("typing", ({ userId, name }) => {
      setTyping((current) => ({ ...current, [userId]: name }));
      clearTimeout(timers[userId]);
      timers[userId] = setTimeout(() => {
        setTyping((current) => {
          const next = { ...current };
          delete next[userId];
          return next;
        });
      }, TYPING_SHOWN_MS);
    });
    document.addEventListener("visibilitychange", sendVisibility);

    return () => {
      document.removeEventListener("visibilitychange", sendVisibility);
      Object.values(timers).forEach(clearTimeout);
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
    // The room is identified by roomKey; `room` itself may be a new object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, roomKey, queryClient]);

  const send = useCallback(
    async (payload) => {
      const socket = socketRef.current;
      if (!socket || !(await waitForConnection(socket, CONNECT_WAIT_MS))) {
        return { ok: false, error: "Reconnecting to chat. Try again in a moment." };
      }
      return new Promise((resolve) => {
        const timer = setTimeout(
          () => resolve({ ok: false, error: "That may not have sent. Check your connection." }),
          10000
        );
        socket.emit("send-message", payload, (ack) => {
          clearTimeout(timer);
          resolve(ack || { ok: false, error: "Couldn't send that message." });
        });
      });
    },
    []
  );

  const notifyTyping = useCallback(() => socketRef.current?.emit("typing"), []);

  const loadEarlier = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const older = await getRoomMessages(room, token, messages[0]._id);
      if (older.length < PAGE_SIZE) setHasMore(false);
      queryClient.setQueryData(queryKey, (previous) => mergeMessages(previous, older));
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, messages, token, queryClient, roomKey]);

  return {
    messages,
    isLoading,
    isError,
    error,
    connected,
    hasMore,
    loadingMore,
    loadEarlier,
    send,
    notifyTyping,
    typingNames: Object.values(typing),
    queryKey,
    roomKey,
  };
}

export { useChatRoom, roomKeyOf, messagesQueryKey, mergeMessages };
