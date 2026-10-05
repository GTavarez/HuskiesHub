import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChatReports, resolveChatReport } from "../../../api/chat.js";
import { useToast } from "../../../context/ToastContext.js";

const FILTERS = [
  ["open", "Open"],
  ["actioned", "Message removed"],
  ["dismissed", "Dismissed"],
];

// Messages that members flagged in a chat. Each comes with the few messages
// before it for context. An admin can remove the message or dismiss the report.
function ChatReportsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [status, setStatus] = useState("open");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["chatReports", status],
    queryFn: () => getChatReports(status, token),
    enabled: Boolean(token),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }) => resolveChatReport(id, action, token),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chatReports"] });
      pushToast({
        type: "success",
        message: variables.action === "delete-message" ? "Message removed." : "Report dismissed.",
      });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Couldn't update the report." });
    },
  });

  return (
    <div>
      <p className="portal__subtitle" style={{ marginBottom: 12 }}>
        Messages members have reported in team, group and private chats. You only see the reported
        message and a few before it, not the whole chat.
      </p>

      <div className="portal__row" style={{ gap: 16, marginBottom: 12 }}>
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={status === value ? "portal__button" : "portal__link-button"}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <p className="portal__empty">Loading…</p>}
      {!isLoading && reports.length === 0 && (
        <p className="portal__empty">{status === "open" ? "No reports waiting for review." : "Nothing here."}</p>
      )}

      {reports.map((report) => (
        <div key={report._id} className="portal__card">
          <p className="portal__card-meta">
            Reported by {report.reporterName} · {new Date(report.createdAt).toLocaleString()}
          </p>
          {report.context.map((line, index) => (
            <p key={`${report._id}-ctx-${index}`} className="portal__card-meta">
              {line.senderName}: {line.text}
            </p>
          ))}
          <p>
            <strong>{report.senderName}:</strong> {report.textSnapshot || "Photo"}
            {report.messageDeleted && <em> (since removed)</em>}
          </p>
          {report.reason && <p className="portal__card-meta">Reason: {report.reason}</p>}
          {status === "open" && (
            <div className="portal__row" style={{ gap: 12 }}>
              {!report.messageDeleted && (
                <button
                  type="button"
                  className="portal__button"
                  disabled={resolveMutation.isPending}
                  onClick={() => {
                    if (window.confirm("Remove this message for everyone?")) {
                      resolveMutation.mutate({ id: report._id, action: "delete-message" });
                    }
                  }}
                >
                  Remove message
                </button>
              )}
              <button
                type="button"
                className="portal__link-button"
                disabled={resolveMutation.isPending}
                onClick={() => resolveMutation.mutate({ id: report._id, action: "dismiss" })}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChatReportsPanel;
