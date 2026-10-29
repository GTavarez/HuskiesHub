import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTryouts,
  updateTryoutStatus,
  moveTryoutToTeam,
  deleteTryout,
} from "../../../api/tryouts.js";
import { getTeams } from "../../../api/teams.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const VIEWS = [
  { key: "new", label: "New" },
  { key: "scheduled", label: "Scheduled" },
  { key: "joined", label: "On a team" },
  { key: "passed", label: "Passed" },
];

const formatDay = (value) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

function MoveToTeamForm({ tryout, teams, token, onMoved }) {
  const { pushToast } = useToast();
  const [teamId, setTeamId] = useState("");
  const [jersey, setJersey] = useState("");

  const moveMutation = useMutation({
    mutationFn: () => moveTryoutToTeam(tryout._id, { teamId, jersey }, token),
    onSuccess: () => {
      const team = teams.find((t) => t._id === teamId);
      pushToast({ type: "success", message: `${tryout.playerName} is on ${team?.name || "the team"}.` });
      onMoved();
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to move her to the team." });
    },
  });

  return (
    <div style={{ marginTop: 10 }}>
      <label className="portal__label" htmlFor={`team-${tryout._id}`}>Move to team</label>
      <select
        id={`team-${tryout._id}`}
        className="portal__select"
        value={teamId}
        onChange={(e) => setTeamId(e.target.value)}
      >
        <option value="">Choose a team</option>
        {teams.map((team) => (
          <option key={team._id} value={team._id}>{team.name}</option>
        ))}
      </select>

      <label className="portal__label" htmlFor={`jersey-${tryout._id}`}>Jersey number (optional)</label>
      <input
        id={`jersey-${tryout._id}`}
        className="portal__input"
        inputMode="numeric"
        value={jersey}
        onChange={(e) => setJersey(e.target.value)}
      />

      <button
        type="button"
        className="portal__button"
        disabled={!teamId || moveMutation.isPending}
        onClick={() => moveMutation.mutate()}
      >
        {moveMutation.isPending ? "Moving..." : "Move to team"}
      </button>
    </div>
  );
}

function TryoutsPanel({ token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [view, setView] = useState("new");

  const { data: tryouts = [] } = useQuery({
    queryKey: ["tryouts", view],
    queryFn: () => getTryouts(view, token),
    enabled: Boolean(token),
  });
  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tryouts"] });
  const teamName = (id) => teams.find((t) => t._id === id)?.name || "a team";

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTryoutStatus(id, status, token),
    onSuccess: invalidate,
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to update the tryout." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTryout(id, token),
    onSuccess: () => {
      invalidate();
      pushToast({ type: "success", message: "Registration removed." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to remove the registration." });
    },
  });

  return (
    <div>
      <p style={{ color: "#9fbad1", fontSize: 14, marginTop: 0 }}>
        Registrations from the public Tryouts page. Families schedule the private tryout by email or
        phone, so use Scheduled to keep track. When a player comes on, Move to team adds her to that
        team's roster with her parent's email and phone.
      </p>

      <div className="portal__tabs" style={{ marginBottom: 16 }}>
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={`portal__tab${view === v.key ? " portal__tab--active" : ""}`}
            onClick={() => setView(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {tryouts.length === 0 && <p className="portal__empty">Nothing here.</p>}

      {tryouts.map((t) => (
        <div key={t._id} className="portal__card">
          <div className="portal__card-header">
            <span className="portal__badge">{t.ageGroup}</span>
            <strong>{t.playerName}</strong>
            <span style={{ marginLeft: "auto", color: "#9fbad1", fontSize: 13 }}>{formatDay(t.createdAt)}</span>
          </div>

          <p className="portal__card-meta">
            {t.position}
            {t.birthDate ? ` · Born ${formatDay(t.birthDate)}` : ""}
            {t.currentTeam ? ` · Current team: ${t.currentTeam}` : ""}
          </p>
          {t.previousClubExperience && (
            <p className="portal__card-meta" style={{ whiteSpace: "pre-wrap" }}>
              Experience: {t.previousClubExperience}
            </p>
          )}
          <p className="portal__card-meta">
            Parent: {t.parentName} ·{" "}
            <a href={`mailto:${t.parentEmail}`}>{t.parentEmail}</a> ·{" "}
            <a href={`tel:${t.parentPhone}`}>{t.parentPhone}</a>
          </p>

          {t.status === "joined" ? (
            <p className="portal__card-meta">On {teamName(t.teamId)}.</p>
          ) : (
            <>
              <div style={{ marginTop: 8 }}>
                {t.status !== "scheduled" && (
                  <button
                    type="button"
                    className="portal__button"
                    style={{ marginRight: 8 }}
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: t._id, status: "scheduled" })}
                  >
                    Mark scheduled
                  </button>
                )}
                {t.status !== "passed" && (
                  <button
                    type="button"
                    className="portal__link-button"
                    style={{ marginRight: 8 }}
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: t._id, status: "passed" })}
                  >
                    Not a fit
                  </button>
                )}
                {t.status !== "new" && (
                  <button
                    type="button"
                    className="portal__link-button"
                    style={{ marginRight: 8 }}
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: t._id, status: "new" })}
                  >
                    Back to new
                  </button>
                )}
              </div>
              <MoveToTeamForm tryout={t} teams={teams} token={token} onMoved={invalidate} />
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              className="portal__link-button"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm(`Remove ${t.playerName}'s registration?`)) deleteMutation.mutate(t._id);
              }}
            >
              Remove registration
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TryoutsPanel;
