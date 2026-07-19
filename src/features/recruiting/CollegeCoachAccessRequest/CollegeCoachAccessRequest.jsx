import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { requestCollegeCoachAccess } from "../../../api/collegeCoachAccess.js";
import { useToast } from "../../../context/ToastContext.js";

function CollegeCoachAccessRequest({ currentUser, token }) {
  const { pushToast } = useToast();
  const [organization, setOrganization] = useState("");
  const [status, setStatus] = useState(currentUser?.collegeCoachStatus || "none");

  const requestMutation = useMutation({
    mutationFn: () => requestCollegeCoachAccess(organization, token),
    onSuccess: (data) => {
      setStatus(data.collegeCoachStatus);
      pushToast({ type: "success", message: "Request submitted for admin review." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to submit request." });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!organization.trim()) {
      pushToast({ type: "error", message: "Enter your school or organization." });
      return;
    }
    requestMutation.mutate();
  };

  if (status === "approved") {
    return <p className="portal__empty">✓ Your college coach access is approved.</p>;
  }

  if (status === "pending") {
    return <p className="portal__empty">Your college coach access request is pending admin approval.</p>;
  }

  return (
    <form className="portal__form" onSubmit={handleSubmit}>
      <p>
        Are you a college coach? Request access to search player recruiting
        profiles.
      </p>
      <label className="portal__label" htmlFor="cc-organization">
        School / Organization
      </label>
      <input
        id="cc-organization"
        className="portal__input"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="e.g. State University Softball"
      />
      <button type="submit" className="portal__button" disabled={requestMutation.isPending}>
        {requestMutation.isPending ? "Submitting..." : "Request College Coach Access"}
      </button>
      {status === "rejected" && (
        <p className="portal__empty">Your previous request was not approved. You may request again.</p>
      )}
    </form>
  );
}

export default CollegeCoachAccessRequest;
