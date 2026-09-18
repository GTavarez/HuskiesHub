import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages } from "../../../api/messages";
import { getConversationMessages } from "../../../api/conversations";
import { queryKeys } from "../../../api/queryKeys";
import { socketUrl } from "../../../utils/config.js";
import "./TeamChat.css";

// Renders either the original whole-team room (teamId) or one coach-created
// group chat (conversationId) — same message list/input UI either way, just
// a different history fetch and a different socket auth payload.
function TeamChat({ teamId, conversationId }) {
  const isGroup = Boolean(conversationId);
  const roomQueryKey = isGroup
    ? queryKeys.conversationMessages(conversationId)
    : queryKeys.messages(teamId);
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  const token = localStorage.getItem("jwt");
  const socketRef = useRef(null);

  // Load chat history
  const {
    data: messages = [],
    isError,
    error,
  } = useQuery({
    queryKey: roomQueryKey,
    queryFn: () =>
      isGroup ? getConversationMessages(conversationId, token) : getMessages(teamId, token),
    enabled: Boolean(token && (isGroup ? conversationId : teamId)),
  });

  // Live socket messages
  useEffect(() => {
    if (!token || (isGroup ? !conversationId : !teamId)) return;
    const socket = io(socketUrl, {
      auth: isGroup ? { token, conversationId } : { token, teamId },
    });
    socketRef.current = socket;

    socket.on("new-message", (message) => {
      queryClient.setQueryData(roomQueryKey, (prev) => [
        ...(Array.isArray(prev) ? prev : []),
        message,
      ]);
    });

    return () => {
      socket.off("new-message");
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, teamId, conversationId, isGroup, token]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: (messageText) =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket) {
          reject(new Error("Chat is not connected."));
          return;
        }
        socket.emit("send-message", messageText);
        resolve();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomQueryKey });
    },
  });

  const sendMessage = () => {
    if (!text.trim()) return;
    if (!socketRef.current) return;
    sendMessageMutation.mutate(text.trim());
    setText("");
  };

  return (
    <div className="team-chat">
      {isError && (
        <p style={{ color: "#f2b8b5", textAlign: "center" }}>
          {error?.message || "Failed to load messages."}
        </p>
      )}
      <div className="team-chat__messages">
        {messages.map((msg) => (
          <div key={msg._id} className="team-chat__message">
            <strong>{msg.senderName}:</strong> {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="team-chat__input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default TeamChat;
