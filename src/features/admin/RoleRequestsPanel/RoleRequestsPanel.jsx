import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} from "../../../api/roleRequests.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

function describeRequest(applicant) {
  if (applicant.roleRequestType === "coach") {
    return applicant.roleRequestTeamId?.name || "—";
  }
  const players = applicant.roleRequestPlayerIds || [];
  if (players.length === 0) return "—";
  return players
    .map((player) => `${player.name}${player.jersey ? ` (#${player.jersey})` : ""}`)
    .join(", ");
}

function RoleRequestsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: pending = [] } = useQuery({
    queryKey: queryKeys.pendingRoleRequests(),
    queryFn: () => getPendingRoleRequests(token),
    enabled: Boolean(token),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.pendingRoleRequests() });

  const approveMutation = useMutation({
    mutationFn: (userId) => approveRoleRequest(userId, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Request approved." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to approve." });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId) => rejectRoleRequest(userId, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Request rejected." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to reject." });
    },
  });

  if (pending.length === 0) {
    return <p className="portal__empty">No pending role requests.</p>;
  }

  return (
    <div>
      {pending.map((applicant) => (
        <div key={applicant._id} className="portal__card portal__card--row">
          <div>
            <strong>{applicant.name}</strong> — {applicant.email}
            <p className="portal__card-meta">
              Requesting <strong>{applicant.roleRequestType}</strong> — {describeRequest(applicant)} ·{" "}
              {new Date(applicant.roleRequestRequestedAt).toLocaleDateString()}
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

export default RoleRequestsPanel;
