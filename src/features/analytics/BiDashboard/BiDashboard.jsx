import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../../../api/analytics.js";
import { queryKeys } from "../../../api/queryKeys.js";
import "./BiDashboard.css";

const formatCents = (cents) =>
  `$${((cents ?? 0) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatPercent = (value) => (value === null || value === undefined ? "No data yet" : `${value}%`);

function StatTile({ label, value, caveat }) {
  return (
    <div className="portal__card bi-dashboard__tile">
      <p className="bi-dashboard__tile-label">{label}</p>
      <p className="bi-dashboard__tile-value">{value}</p>
      {caveat && <p className="bi-dashboard__tile-caveat">{caveat}</p>}
    </div>
  );
}

function BiDashboard({ token }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.analyticsDashboard(),
    queryFn: () => getDashboard(token),
    enabled: Boolean(token),
  });

  if (isLoading) {
    return <p className="portal__empty">Loading dashboard...</p>;
  }

  if (isError || !data) {
    return <p className="portal__empty">Failed to load the dashboard. Try again shortly.</p>;
  }

  const weatherSummary = !data.weather?.configured
    ? "Not configured"
    : data.weather.alerts.length === 0
      ? "No alerts"
      : `${data.weather.alerts.length} alert${data.weather.alerts.length === 1 ? "" : "s"}`;

  return (
    <div className="bi-dashboard">
      <div className="bi-dashboard__grid">
        <StatTile label="Org Revenue (YTD)" value={formatCents(data.orgRevenueCents)} />
        <StatTile label="Outstanding Balance" value={formatCents(data.outstandingBalanceCents)} />
        <StatTile label="Practice Attendance" value={formatPercent(data.practiceAttendanceRate)} />
        <StatTile
          label="Players at Injury Risk"
          value={data.playersAtInjuryRisk}
          caveat="Recent injury-type coach notes, not a medical clearance."
        />
        <StatTile label="Upcoming Tournaments" value={data.upcomingTournaments} />
        <StatTile label="Open Lesson Slots" value={data.openLessonSlots} />
        <StatTile label="Coaches Paid" value={formatPercent(data.coachesPaidRate)} />
        <StatTile label="Pending Hotel Reservations" value={data.pendingHotelReservations} />
        <StatTile label="Weather Alerts (7 days)" value={weatherSummary} />
      </div>
    </div>
  );
}

export default BiDashboard;
