import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveWaiver,
  getWaiverSignatures,
  signWaiver,
} from "../../../api/waivers.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function WaiverSignature({ playerId, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [signedName, setSignedName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { data: waiver } = useQuery({
    queryKey: queryKeys.activeWaiver(),
    queryFn: () => getActiveWaiver(token),
    enabled: Boolean(token),
  });

  const { data: signatures = [] } = useQuery({
    queryKey: queryKeys.waiverSignatures(playerId),
    queryFn: () => getWaiverSignatures({ playerId }, token),
    enabled: Boolean(playerId && token),
  });

  const alreadySigned = Boolean(
    waiver && signatures.some((sig) => sig.waiverId === waiver._id)
  );

  const signMutation = useMutation({
    mutationFn: (payload) => signWaiver(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.waiverSignatures(playerId) });
      pushToast({ type: "success", message: "Waiver signed." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to sign waiver." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!signedName.trim() || !agreedToTerms) {
      pushToast({ type: "error", message: "Type your full name and agree to the terms." });
      return;
    }
    signMutation.mutate({
      playerId,
      waiverId: waiver._id,
      signedName: signedName.trim(),
      agreedToTerms,
    });
  };

  if (!waiver) {
    return <p className="portal__empty">No waiver is configured yet.</p>;
  }

  if (alreadySigned) {
    return <p className="portal__empty">✓ Waiver signed for this player.</p>;
  }

  return (
    <div className="portal__card">
      <strong>{waiver.title}</strong>
      <p className="portal__card-body" style={{ whiteSpace: "pre-wrap" }}>
        {waiver.bodyText}
      </p>
      <form className="portal__form" onSubmit={handleSubmit}>
        <label className="portal__label" htmlFor="waiver-signed-name">
          Type your full legal name to sign
        </label>
        <input
          id="waiver-signed-name"
          className="portal__input"
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          placeholder="Full legal name"
        />

        <label className="portal__checkbox-row" htmlFor="waiver-agree">
          <input
            id="waiver-agree"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          I have read and agree to the terms above
        </label>

        <button
          type="submit"
          className="portal__button"
          disabled={signMutation.isPending}
        >
          {signMutation.isPending ? "Signing..." : "Sign Waiver"}
        </button>
      </form>
    </div>
  );
}

export default WaiverSignature;
