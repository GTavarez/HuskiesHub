import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPendingCollegeCoachRequests,
  approveCollegeCoach,
  rejectCollegeCoach,
} from "../../../api/collegeCoachAccess.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function CollegeCoachApprovalsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: pending = [] } = useQuery({
    queryKey: queryKeys.pendingCollegeCoachRequests(),
    queryFn: () => getPendingCollegeCoachRequests(token),
    enabled: Boolean(token),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.pendingCollegeCoachRequests() });

  const approveMutation = useMutation({
    mutationFn: (userId) => approveCollegeCoach(userId, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Access approved." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to approve." });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId) => rejectCollegeCoach(userId, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Request rejected." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to reject." });
    },
  });

  if (pending.length === 0) {
    return <p className="portal__empty">No pending college coach requests.</p>;
  }

  return (
    <div>
      {pending.map((applicant) => (
        <div key={applicant._id} className="portal__card portal__card--row">
          <div>
            <strong>{applicant.name}</strong> — {applicant.email}
            <p className="portal__card-meta">
              {applicant.collegeCoachOrganization} ·{" "}
              {new Date(applicant.collegeCoachRequestedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <button
              type="button"
              className="portal__button"
              style={{ marginRight: 8 }}
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate(applicant._id)}
            >
              Approve
            </button>
            <button
              type="button"
              className="portal__link-button"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate(applicant._id)}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CollegeCoachApprovalsPanel;
