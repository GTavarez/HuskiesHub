import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPendingRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
} from "../../../api/roleRequests.js";
import { linkChildToParent } from "../../../api/users.js";
import { getTeams, getTeamPlayers } from "../../../api/teams.js";
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

// A parent's linked children are otherwise only ever set once, when their
// initial role request is approved above — there's no self-service path for
// adding a second child to an *already-approved* parent account later (e.g.
// siblings who register weeks apart). This is that missing piece.
function LinkChildForm({ token }) {
  const { pushToast } = useToast();
  const [parentEmail, setParentEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });
  const { data: players = [] } = useQuery({
    queryKey: queryKeys.teamPlayers(teamId),
    queryFn: () => getTeamPlayers(teamId),
    enabled: Boolean(teamId),
  });

  const linkMutation = useMutation({
    mutationFn: () => linkChildToParent({ parentEmail: parentEmail.trim(), playerId }, token),
    onSuccess: (parent) => {
      pushToast({ type: "success", message: `Linked to ${parent.name}'s account.` });
      setParentEmail("");
      setTeamId("");
      setPlayerId("");
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to link child." });
    },
  });

  return (
    <div className="portal__form" style={{ marginBottom: 16 }}>
      <h3 className="portal__section-title">Link an Additional Child to a Parent</h3>
      <p style={{ color: "#9fbad1", fontSize: 14, marginTop: -4 }}>
        For a parent who already has an account (e.g. from a first child's registration) and
        needs a sibling added — new signups should use the request above instead.
      </p>
      <label className="portal__label" htmlFor="link-parent-email">
        Parent's Email
      </label>
      <input
        id="link-parent-email"
        className="portal__input"
        value={parentEmail}
        onChange={(e) => setParentEmail(e.target.value)}
        placeholder="parent@example.com"
      />
      <label className="portal__label" htmlFor="link-team">
        Team
      </label>
      <select
        id="link-team"
        className="portal__select"
        value={teamId}
        onChange={(e) => {
          setTeamId(e.target.value);
          setPlayerId("");
        }}
      >
        <option value="">Select a team…</option>
        {teams.map((team) => (
          <option key={team._id} value={team._id}>
            {team.name}
          </option>
        ))}
      </select>
      <label className="portal__label" htmlFor="link-player">
        Player
      </label>
      <select
        id="link-player"
        className="portal__select"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
        disabled={!teamId}
      >
        <option value="">Select a player…</option>
        {players.map((player) => (
          <option key={player._id} value={player._id}>
            {player.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="portal__button"
        disabled={!parentEmail.trim() || !playerId || linkMutation.isPending}
        onClick={() => linkMutation.mutate()}
      >
        {linkMutation.isPending ? "Linking..." : "Link Child"}
      </button>
    </div>
  );
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

  return (
    <div>
      <LinkChildForm token={token} />

      {pending.length === 0 && <p className="portal__empty">No pending role requests.</p>}
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
