import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { submitRoleRequest } from "../../../api/roleRequests.js";
import { getTeams, getTeamPlayers } from "../../../api/teams.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const ROLE_TYPES = [
  { value: "parent", label: "Parent" },
  { value: "player", label: "Player" },
  { value: "coach", label: "Coach" },
];

function RoleAccessRequest({ currentUser, token }) {
  const { pushToast } = useToast();
  const [status, setStatus] = useState(currentUser?.roleRequestStatus || "none");
  const [roleType, setRoleType] = useState("parent");
  const [teamId, setTeamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [children, setChildren] = useState([]);

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });

  const { data: teamPlayers = [], isLoading: teamPlayersLoading } = useQuery({
    queryKey: queryKeys.teamPlayers(teamId),
    queryFn: () => getTeamPlayers(teamId),
    enabled: Boolean(teamId),
  });
  const teamHasNoPlayers = Boolean(teamId) && !teamPlayersLoading && teamPlayers.length === 0;

  const requestMutation = useMutation({
    mutationFn: (payload) => submitRoleRequest(payload, token),
    onSuccess: (data) => {
      setStatus(data.roleRequestStatus);
      pushToast({ type: "success", message: "Request submitted for admin review." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to submit request." });
    },
  });

  const resetPickers = (nextRoleType) => {
    setRoleType(nextRoleType);
    setTeamId("");
    setPlayerId("");
    setChildren([]);
  };

  const handleAddChild = () => {
    if (!teamId || !playerId) {
      pushToast({ type: "error", message: "Select a team and a child first." });
      return;
    }
    if (children.some((child) => child.playerId === playerId)) {
      pushToast({ type: "error", message: "That child is already added." });
      return;
    }
    const team = teams.find((t) => t._id === teamId);
    const player = teamPlayers.find((p) => p._id === playerId);
    setChildren((prev) => [
      ...prev,
      { teamId, playerId, teamName: team?.name || "", playerName: player?.name || "" },
    ]);
    setTeamId("");
    setPlayerId("");
  };

  const handleRemoveChild = (id) => {
    setChildren((prev) => prev.filter((child) => child.playerId !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roleType === "coach") {
      if (!teamId) {
        pushToast({ type: "error", message: "Select your team." });
        return;
      }
      requestMutation.mutate({ roleRequestType: "coach", teamId });
      return;
    }
    if (roleType === "player") {
      if (!teamId || !playerId) {
        pushToast({ type: "error", message: "Select your team and your name on the roster." });
        return;
      }
      requestMutation.mutate({ roleRequestType: "player", playerIds: [playerId] });
      return;
    }
    if (children.length === 0) {
      pushToast({ type: "error", message: "Add at least one child." });
      return;
    }
    requestMutation.mutate({
      roleRequestType: "parent",
      playerIds: children.map((child) => child.playerId),
    });
  };

  if (currentUser?.role !== "fan") return null;

  if (status === "pending") {
    return (
      <p className="portal__empty">
        Your request to become a {currentUser?.roleRequestType || "player/parent/coach"} is pending admin
        approval.
      </p>
    );
  }

  return (
    <form className="portal__form" onSubmit={handleSubmit}>
      <p>Are you a parent, player, or coach? Request access to your schedule, roster, and payments.</p>

      <label className="portal__label" htmlFor="role-request-type">
        I am a...
      </label>
      <select
        id="role-request-type"
        className="portal__select"
        value={roleType}
        onChange={(e) => resetPickers(e.target.value)}
      >
        {ROLE_TYPES.map((rt) => (
          <option key={rt.value} value={rt.value}>
            {rt.label}
          </option>
        ))}
      </select>

      {roleType === "coach" && (
        <>
          <label className="portal__label" htmlFor="role-request-team">
            Team
          </label>
          <select
            id="role-request-team"
            className="portal__select"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Select a team…</option>
            {teams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </>
      )}

      {roleType === "player" && (
        <>
          <label className="portal__label" htmlFor="role-request-team">
            Team
          </label>
          <select
            id="role-request-team"
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

          <label className="portal__label" htmlFor="role-request-player">
            Your name on the roster
          </label>
          <select
            id="role-request-player"
            className="portal__select"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            disabled={!teamId}
          >
            <option value="">Select your name…</option>
            {teamPlayers.map((player) => (
              <option key={player._id} value={player._id}>
                {player.name}
                {player.jersey ? ` (#${player.jersey})` : ""}
              </option>
            ))}
          </select>
          {teamHasNoPlayers && (
            <p className="portal__empty">
              No players are on this team's roster yet. Contact us at cesportstraining@gmail.com and
              we'll get you added.
            </p>
          )}
        </>
      )}

      {roleType === "parent" && (
        <>
          <label className="portal__label">Children</label>
          {children.map((child) => (
            <div className="portal__row" key={child.playerId}>
              <span>
                {child.playerName} — {child.teamName}
              </span>
              <button
                type="button"
                className="portal__link-button"
                onClick={() => handleRemoveChild(child.playerId)}
              >
                Remove
              </button>
            </div>
          ))}

          <div className="portal__row">
            <select
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
            <select
              className="portal__select"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              disabled={!teamId}
            >
              <option value="">Select your child…</option>
              {teamPlayers.map((player) => (
                <option key={player._id} value={player._id}>
                  {player.name}
                  {player.jersey ? ` (#${player.jersey})` : ""}
                </option>
              ))}
            </select>
            <button type="button" className="portal__button" onClick={handleAddChild}>
              Add
            </button>
          </div>
          {teamHasNoPlayers && (
            <p className="portal__empty">
              No players are on this team's roster yet. Contact us at cesportstraining@gmail.com and
              we'll get your child added.
            </p>
          )}
        </>
      )}

      <button type="submit" className="portal__button" disabled={requestMutation.isPending}>
        {requestMutation.isPending ? "Submitting..." : "Request Access"}
      </button>

      {status === "rejected" && (
        <p className="portal__empty">Your previous request was not approved. You may request again.</p>
      )}
    </form>
  );
}

export default RoleAccessRequest;
