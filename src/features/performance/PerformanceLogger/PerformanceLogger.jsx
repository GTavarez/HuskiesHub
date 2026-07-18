import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTeamPlayers } from "../../../api/teams.js";
import {
  getEntries,
  createEntry,
  getGoals,
  createGoal,
  updateGoal,
} from "../../../api/performance.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { useToast } from "../../../context/ToastContext.js";

const METRIC_TYPES = [
  "strength",
  "mobility",
  "speed",
  "jump",
  "exitVelocity",
  "throwingVelocity",
  "batSpeed",
  "armCare",
  "weightRoom",
];

function PerformanceLogger({ teamId, token }) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [metricType, setMetricType] = useState(METRIC_TYPES[0]);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [notes, setNotes] = useState("");

  const [goalMetricType, setGoalMetricType] = useState(METRIC_TYPES[0]);
  const [goalTargetValue, setGoalTargetValue] = useState("");
  const [goalTargetUnit, setGoalTargetUnit] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");

  const { data: players = [] } = useQuery({
    queryKey: queryKeys.teamPlayers(teamId),
    queryFn: () => getTeamPlayers(teamId),
    enabled: Boolean(teamId),
  });

  const { data: entries = [] } = useQuery({
    queryKey: queryKeys.performanceEntries(selectedPlayerId),
    queryFn: () => getEntries(selectedPlayerId, token),
    enabled: Boolean(selectedPlayerId && token),
  });

  const { data: goals = [] } = useQuery({
    queryKey: queryKeys.performanceGoals(selectedPlayerId),
    queryFn: () => getGoals(selectedPlayerId, token),
    enabled: Boolean(selectedPlayerId && token),
  });

  const createEntryMutation = useMutation({
    mutationFn: (payload) => createEntry(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performanceEntries(selectedPlayerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.performanceGoals(selectedPlayerId) });
      setValue("");
      setNotes("");
      pushToast({ type: "success", message: "Entry logged." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to log entry." });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (payload) => createGoal(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performanceGoals(selectedPlayerId) });
      setGoalTargetValue("");
      setGoalTargetUnit("");
      setGoalTargetDate("");
      pushToast({ type: "success", message: "Goal set." });
    },
    onError: (error) => {
      pushToast({ type: "error", message: error?.message || "Failed to set goal." });
    },
  });

  const achieveMutation = useMutation({
    mutationFn: ({ goalId, achieved }) => updateGoal(goalId, { achieved }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performanceGoals(selectedPlayerId) });
    },
  });

  const handleEntrySubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayerId || !value || !unit) {
      pushToast({ type: "error", message: "Select a player and enter a value and unit." });
      return;
    }
    createEntryMutation.mutate({
      playerId: selectedPlayerId,
      metricType,
      value: Number(value),
      unit,
      recordedAt: recordedAt ? new Date(recordedAt).toISOString() : undefined,
      notes,
    });
  };

  const handleGoalSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayerId || !goalTargetValue || !goalTargetUnit) {
      pushToast({ type: "error", message: "Select a player and enter a target value and unit." });
      return;
    }
    createGoalMutation.mutate({
      playerId: selectedPlayerId,
      metricType: goalMetricType,
      targetValue: Number(goalTargetValue),
      targetUnit: goalTargetUnit,
      targetDate: goalTargetDate || null,
    });
  };

  return (
    <div>
      <label className="portal__label" htmlFor="perf-player">
        Player
      </label>
      <select
        id="perf-player"
        className="portal__select"
        value={selectedPlayerId}
        onChange={(e) => setSelectedPlayerId(e.target.value)}
      >
        <option value="">Select a player…</option>
        {players.map((player) => (
          <option key={player._id} value={player._id}>
            #{player.jersey} {player.name}
          </option>
        ))}
      </select>

      {selectedPlayerId && (
        <>
          <form className="portal__form" style={{ marginTop: 16 }} onSubmit={handleEntrySubmit}>
            <label className="portal__label" htmlFor="perf-metric">
              Metric
            </label>
            <select
              id="perf-metric"
              className="portal__select"
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
            >
              {METRIC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label className="portal__label" htmlFor="perf-value">
              Value
            </label>
            <input
              id="perf-value"
              className="portal__input"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />

            <label className="portal__label" htmlFor="perf-unit">
              Unit
            </label>
            <input
              id="perf-unit"
              className="portal__input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="mph, seconds, inches, lbs..."
            />

            <label className="portal__label" htmlFor="perf-date">
              Date
            </label>
            <input
              id="perf-date"
              className="portal__input"
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />

            <label className="portal__label" htmlFor="perf-notes">
              Notes
            </label>
            <textarea
              id="perf-notes"
              className="portal__textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button
              type="submit"
              className="portal__button"
              disabled={createEntryMutation.isPending}
            >
              {createEntryMutation.isPending ? "Saving..." : "Log Entry"}
            </button>
          </form>

          <h3 className="portal__section-title">History</h3>
          {entries.length === 0 && <p className="portal__empty">No entries yet.</p>}
          {[...entries].reverse().map((entry) => (
            <div key={entry._id} className="portal__card">
              <span className="portal__badge">{entry.metricType}</span>{" "}
              <strong>
                {entry.value} {entry.unit}
              </strong>
              <p className="portal__card-meta">
                {new Date(entry.recordedAt).toLocaleDateString()}
                {entry.notes ? ` · ${entry.notes}` : ""}
              </p>
            </div>
          ))}

          <h3 className="portal__section-title">Goals</h3>
          <form className="portal__form" onSubmit={handleGoalSubmit}>
            <label className="portal__label" htmlFor="goal-metric">
              Metric
            </label>
            <select
              id="goal-metric"
              className="portal__select"
              value={goalMetricType}
              onChange={(e) => setGoalMetricType(e.target.value)}
            >
              {METRIC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label className="portal__label" htmlFor="goal-target-value">
              Target Value
            </label>
            <input
              id="goal-target-value"
              className="portal__input"
              type="number"
              value={goalTargetValue}
              onChange={(e) => setGoalTargetValue(e.target.value)}
            />

            <label className="portal__label" htmlFor="goal-target-unit">
              Target Unit
            </label>
            <input
              id="goal-target-unit"
              className="portal__input"
              value={goalTargetUnit}
              onChange={(e) => setGoalTargetUnit(e.target.value)}
            />

            <label className="portal__label" htmlFor="goal-target-date">
              Target Date (optional)
            </label>
            <input
              id="goal-target-date"
              className="portal__input"
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
            />

            <button
              type="submit"
              className="portal__button"
              disabled={createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? "Saving..." : "Set Goal"}
            </button>
          </form>

          {goals.length === 0 && <p className="portal__empty">No goals set yet.</p>}
          {goals.map((goal) => (
            <div key={goal._id} className="portal__card portal__card--row">
              <div>
                <span className="portal__badge">{goal.metricType}</span>{" "}
                <span>
                  Target: {goal.targetValue} {goal.targetUnit}
                </span>
                {goal.achieved && (
                  <span className="portal__badge portal__badge--game" style={{ marginLeft: 8 }}>
                    achieved
                  </span>
                )}
              </div>
              {!goal.achieved && (
                <button
                  type="button"
                  className="portal__link-button"
                  onClick={() => achieveMutation.mutate({ goalId: goal._id, achieved: true })}
                >
                  Mark Achieved
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default PerformanceLogger;
