import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChatPhotoBlob } from "../../../api/messages";
import "./ChatPhoto.css";

// One photo inside a chat bubble. The file is behind auth, so it is fetched
// with the token and shown from an object URL; tapping it opens the full
// size in a new tab.
function ChatPhoto({ messageId, token }) {
  const [url, setUrl] = useState(null);

  const { data: blob, isError } = useQuery({
    queryKey: ["chatPhoto", messageId],
    queryFn: () => getChatPhotoBlob(messageId, token),
    enabled: Boolean(messageId && token),
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (!blob) return undefined;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (isError) return <p className="chat-photo__missing">Photo unavailable</p>;
  if (!url) return <div className="chat-photo chat-photo--loading" aria-label="Loading photo" />;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="chat-photo__link">
      <img className="chat-photo" src={url} alt="Shared in chat" />
    </a>
  );
}

export default ChatPhoto;
