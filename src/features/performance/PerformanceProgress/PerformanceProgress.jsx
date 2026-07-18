import { useQuery } from "@tanstack/react-query";
import { getEntries, getGoals } from "../../../api/performance.js";
import { queryKeys } from "../../../api/queryKeys.js";
import "./PerformanceProgress.css";

const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;
const CHART_PADDING = 24;
// Validated against the app's dark portal surface (contrast >= 3:1) —
// see dataviz skill's validate_palette.js. Single-series charts don't need
// the categorical-lightness-band check, only contrast, which this passes.
const LINE_COLOR = "#64b5f6";
const GOAL_LINE_COLOR = "rgba(248, 251, 255, 0.35)";

function MetricChart({ metricType, entries, goal }) {
  const values = entries.map((entry) => entry.value);
  const goalValue = goal ? goal.targetValue : null;
  const allValues = goalValue !== null ? [...values, goalValue] : values;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const plotWidth = CHART_WIDTH - CHART_PADDING * 2;
  const plotHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const xFor = (index) =>
    CHART_PADDING + (entries.length > 1 ? (index / (entries.length - 1)) * plotWidth : plotWidth / 2);
  const yFor = (value) => CHART_PADDING + plotHeight - ((value - min) / range) * plotHeight;

  const linePoints = entries.map((entry, index) => `${xFor(index)},${yFor(entry.value)}`).join(" ");
  const latest = entries[entries.length - 1];

  return (
    <div className="metric-chart">
      <div className="metric-chart__header">
        <strong>{metricType}</strong>
        {goal && (
          <span className={`portal__badge${goal.achieved ? " portal__badge--game" : ""}`}>
            Goal: {goal.targetValue} {goal.targetUnit}
            {goal.achieved ? " ✓" : ""}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        role="img"
        aria-label={`${metricType} progress over time, latest value ${latest.value} ${latest.unit}`}
      >
        {/* Recessive baseline */}
        <line
          x1={CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING}
          x2={CHART_WIDTH - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          stroke="rgba(185, 200, 222, 0.2)"
          strokeWidth="1"
        />

        {goalValue !== null && (
          <line
            x1={CHART_PADDING}
            y1={yFor(goalValue)}
            x2={CHART_WIDTH - CHART_PADDING}
            y2={yFor(goalValue)}
            stroke={GOAL_LINE_COLOR}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}

        {entries.length > 1 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke={LINE_COLOR}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {entries.map((entry, index) => (
          <circle key={entry._id} cx={xFor(index)} cy={yFor(entry.value)} r="4" fill={LINE_COLOR}>
            <title>
              {new Date(entry.recordedAt).toLocaleDateString()}: {entry.value} {entry.unit}
            </title>
          </circle>
        ))}

        {/* Direct label on the latest point only — not every point */}
        <text
          x={xFor(entries.length - 1)}
          y={yFor(latest.value) - 10}
          fill="#f8fbff"
          fontSize="11"
          textAnchor="end"
        >
          {latest.value} {latest.unit}
        </text>
      </svg>

      {/* Accessible text equivalent of the chart above */}
      <details className="metric-chart__table">
        <summary>View as list</summary>
        <ul>
          {[...entries].reverse().map((entry) => (
            <li key={entry._id}>
              {new Date(entry.recordedAt).toLocaleDateString()}: {entry.value} {entry.unit}
              {entry.notes ? ` — ${entry.notes}` : ""}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function PerformanceProgress({ playerId, token }) {
  const { data: entries = [] } = useQuery({
    queryKey: queryKeys.performanceEntries(playerId),
    queryFn: () => getEntries(playerId, token),
    enabled: Boolean(playerId && token),
  });

  const { data: goals = [] } = useQuery({
    queryKey: queryKeys.performanceGoals(playerId),
    queryFn: () => getGoals(playerId, token),
    enabled: Boolean(playerId && token),
  });

  const entriesByMetric = entries.reduce((acc, entry) => {
    acc[entry.metricType] = acc[entry.metricType] || [];
    acc[entry.metricType].push(entry);
    return acc;
  }, {});

  const metricTypes = Object.keys(entriesByMetric);

  if (metricTypes.length === 0) {
    return <p className="portal__empty">No performance data logged yet.</p>;
  }

  return (
    <div className="metric-chart__grid">
      {metricTypes.map((metricType) => {
        const openGoal = goals.find((goal) => goal.metricType === metricType && !goal.achieved);
        const achievedGoal = goals.find((goal) => goal.metricType === metricType && goal.achieved);
        return (
          <MetricChart
            key={metricType}
            metricType={metricType}
            entries={entriesByMetric[metricType]}
            goal={openGoal || achievedGoal || null}
          />
        );
      })}
    </div>
  );
}

export default PerformanceProgress;
