import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActiveWaiver, createWaiverVersion, getWaiverSignatures } from "../../../api/waivers.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function WaiverPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");

  const { data: activeWaiver } = useQuery({
    queryKey: queryKeys.activeWaiver(),
    queryFn: () => getActiveWaiver(token),
    enabled: Boolean(token),
  });

  const { data: signatures = [] } = useQuery({
    queryKey: queryKeys.waiverSignatures(undefined),
    queryFn: () => getWaiverSignatures({}, token),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createWaiverVersion(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeWaiver() });
      setTitle("");
      setBodyText("");
      setEffectiveDate("");
      pushToast({ type: "success", message: "New waiver version published." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to publish waiver." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim() || !effectiveDate) {
      pushToast({ type: "error", message: "Title, body text, and effective date are required." });
      return;
    }
    createMutation.mutate({ title: title.trim(), bodyText: bodyText.trim(), effectiveDate });
  };

  return (
    <div>
      {activeWaiver && (
        <div className="portal__card">
          <strong>
            Current: {activeWaiver.title} (v{activeWaiver.version})
          </strong>
          <p className="portal__card-body" style={{ whiteSpace: "pre-wrap" }}>
            {activeWaiver.bodyText}
          </p>
        </div>
      )}

      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="waiver-title">
          New Version Title
        </label>
        <input
          id="waiver-title"
          className="portal__input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="portal__label" htmlFor="waiver-body">
          Waiver Text
        </label>
        <textarea
          id="waiver-body"
          className="portal__textarea"
          rows={6}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
        />

        <label className="portal__label" htmlFor="waiver-effective">
          Effective Date
        </label>
        <input
          id="waiver-effective"
          className="portal__input"
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
        />

        <button type="submit" className="portal__button" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Publishing..." : "Publish New Version"}
        </button>
      </form>

      <h3 className="portal__section-title">Signatures</h3>
      {signatures.length === 0 && <p className="portal__empty">No signatures yet.</p>}
      {signatures.map((signature) => (
        <div key={signature._id} className="portal__card">
          <strong>{signature.signedName}</strong>{" "}
          <span className="portal__badge">v{signature.snapshotVersion}</span>
          <p className="portal__card-meta">
            {new Date(signature.signedAt).toLocaleString()} · {signature.ipAddress}
          </p>
        </div>
      ))}
    </div>
  );
}

export default WaiverPanel;
