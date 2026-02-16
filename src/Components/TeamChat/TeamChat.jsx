import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages } from "../../api/messages";
import { queryKeys } from "../../api/queryKeys";
import "./TeamChat.css";

function TeamChat({ teamId }) {
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
    queryKey: queryKeys.messages(teamId),
    queryFn: () => getMessages(teamId, token),
    enabled: Boolean(teamId && token),
  });

  // Live socket messages
  useEffect(() => {
    if (!token || !teamId) return;
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("new-message", (message) => {
      queryClient.setQueryData(queryKeys.messages(teamId), (prev) => [
        ...(Array.isArray(prev) ? prev : []),
        message,
      ]);
    });

    return () => {
      socket.off("new-message");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, teamId, token]);

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
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages(teamId),
      });
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
