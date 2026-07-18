import { useState } from "react";
import PracticePlans from "../PracticePlans/PracticePlans.jsx";
import AttendanceRecorder from "../AttendanceRecorder/AttendanceRecorder.jsx";
import PlayerNotes from "../PlayerNotes/PlayerNotes.jsx";
import PerformanceLogger from "../../performance/PerformanceLogger/PerformanceLogger.jsx";
import AiAssistant from "../../analytics/AiAssistant/AiAssistant.jsx";
import "../../shared/portal.css";

const TABS = [
  { key: "plans", label: "Practice Plans" },
  { key: "attendance", label: "Attendance" },
  { key: "notes", label: "Player Notes" },
  { key: "performance", label: "Performance" },
  { key: "assistant", label: "Assistant" },
];

function CoachDashboard({ currentUser, token }) {
  const [activeTab, setActiveTab] = useState("plans");
  const teamId = currentUser?.teamId;

  if (!teamId) {
    return (
      <section className="portal">
        <div className="portal__panel">
          <h1 className="portal__title">Coach Portal</h1>
          <p className="portal__subtitle">
            No team is linked to your account yet. Contact your club admin to
            get assigned to a team.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">Coach Portal</h1>
        <p className="portal__subtitle">
          Build practices, record attendance, and log player notes.
        </p>

        <div className="portal__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`portal__tab${
                activeTab === tab.key ? " portal__tab--active" : ""
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "plans" && <PracticePlans teamId={teamId} token={token} />}
        {activeTab === "attendance" && (
          <AttendanceRecorder teamId={teamId} token={token} />
        )}
        {activeTab === "notes" && <PlayerNotes teamId={teamId} token={token} />}
        {activeTab === "performance" && (
          <PerformanceLogger teamId={teamId} token={token} />
        )}
        {activeTab === "assistant" && <AiAssistant context="coach" token={token} />}
      </div>
    </section>
  );
}

export default CoachDashboard;
