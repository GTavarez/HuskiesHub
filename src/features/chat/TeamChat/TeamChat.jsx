import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendChatPhoto } from "../../../api/messages";
import { getConversationMessages } from "../../../api/conversations";
import { queryKeys } from "../../../api/queryKeys";
import { socketUrl } from "../../../utils/config.js";
import { useToast } from "../../../context/ToastContext.js";
import ChatPhoto from "../ChatPhoto/ChatPhoto.jsx";
import "./TeamChat.css";

const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

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
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const { pushToast } = useToast();
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
      queryClient.setQueryData(roomQueryKey, (prev) => {
        const list = Array.isArray(prev) ? prev : [];
        // A photo message can arrive both over the socket and in a refetch.
        if (list.some((m) => m._id === message._id)) return list;
        return [...list, message];
      });
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

  const clearPhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Preview URL for the photo waiting to be sent.
  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const handlePhotoPicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      pushToast({ type: "error", message: "That photo is too large (15 MB max)." });
      clearPhoto();
      return;
    }
    setPhoto(file);
  };

  const sendPhotoMutation = useMutation({
    mutationFn: ({ file, caption }) =>
      sendChatPhoto({ teamId, conversationId, file, text: caption }, token),
    onSuccess: () => {
      clearPhoto();
      setText("");
      queryClient.invalidateQueries({ queryKey: roomQueryKey });
    },
    onError: (err) => {
      pushToast({ type: "error", message: err?.message || "Couldn't send the photo." });
    },
  });

  const sendMessage = () => {
    if (photo) {
      if (sendPhotoMutation.isPending) return;
      sendPhotoMutation.mutate({ file: photo, caption: text.trim() });
      return;
    }
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
            {msg.imageId && <ChatPhoto messageId={msg._id} token={token} />}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {photoPreview && (
        <div className="team-chat__attachment">
          <img src={photoPreview} alt="Photo to send" className="team-chat__attachment-img" />
          <button
            type="button"
            className="team-chat__attachment-remove"
            onClick={clearPhoto}
            disabled={sendPhotoMutation.isPending}
            aria-label="Remove photo"
          >
            Remove
          </button>
        </div>
      )}

      <div className="team-chat__input">
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
          disabled={sendPhotoMutation.isPending}
          aria-label="Attach a photo"
          title="Attach a photo"
        >
          Photo
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={photo ? "Add a caption (optional)..." : "Type a message..."}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={sendPhotoMutation.isPending}>
          {sendPhotoMutation.isPending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default TeamChat;
