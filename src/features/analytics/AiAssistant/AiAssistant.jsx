import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { askAssistant } from "../../../api/aiAssistant.js";
import "./AiAssistant.css";

const SpeechRecognitionImpl =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

const CONTEXT_PLACEHOLDER = {
  parent: "Ask about your child's schedule, attendance, or balance…",
  coach: "Ask about your roster, attendance, or say a note to save…",
  admin: "Ask about org revenue, balances, or attendance…",
};

function AiAssistant({ context = "parent", token }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const nextMessageId = useRef(0);
  const makeMessage = (fields) => ({ id: nextMessageId.current++, ...fields });

  const askMutation = useMutation({
    mutationFn: (q) => askAssistant(q, token),
    onSuccess: (result, q) => {
      setMessages((prev) => [
        ...prev,
        makeMessage({ role: "user", text: q }),
        makeMessage({ role: "assistant", text: result.answer, toolsUsed: result.toolsUsed }),
      ]);
      setQuestion("");
    },
    onError: (error, q) => {
      setMessages((prev) => [
        ...prev,
        makeMessage({ role: "user", text: q }),
        makeMessage({
          role: "assistant",
          text: error?.message || "Something went wrong. Try again.",
          isError: true,
        }),
      ]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || askMutation.isPending) return;
    askMutation.mutate(trimmed);
  };

  const handleMicClick = () => {
    if (!SpeechRecognitionImpl) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="ai-assistant">
      <div className="ai-assistant__messages">
        {messages.length === 0 && (
          <p className="portal__empty">
            {CONTEXT_PLACEHOLDER[context] || CONTEXT_PLACEHOLDER.parent}
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-assistant__message ai-assistant__message--${message.role}${
              message.isError ? " ai-assistant__message--error" : ""
            }`}
          >
            {message.text}
          </div>
        ))}
        {askMutation.isPending && (
          <div className="ai-assistant__message ai-assistant__message--assistant">
            Thinking...
          </div>
        )}
      </div>

      <form className="ai-assistant__form" onSubmit={handleSubmit}>
        <input
          className="portal__input ai-assistant__input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={CONTEXT_PLACEHOLDER[context] || CONTEXT_PLACEHOLDER.parent}
          disabled={askMutation.isPending}
        />
        {context === "coach" && SpeechRecognitionImpl && (
          <button
            type="button"
            className={`ai-assistant__mic${isListening ? " ai-assistant__mic--active" : ""}`}
            onClick={handleMicClick}
            title={isListening ? "Stop listening" : "Speak your question or note"}
          >
            {isListening ? "● Listening" : "🎤"}
          </button>
        )}
        <button
          type="submit"
          className="portal__button"
          disabled={askMutation.isPending || !question.trim()}
        >
          Ask
        </button>
      </form>
      {context === "coach" && !SpeechRecognitionImpl && (
        <p className="ai-assistant__voice-note">
          Voice input isn&apos;t supported in this browser — type your question instead.
        </p>
      )}
    </div>
  );
}

export default AiAssistant;
