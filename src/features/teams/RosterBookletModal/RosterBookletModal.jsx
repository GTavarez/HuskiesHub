import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTeamShowcaseDetails } from "../../../api/players.js";
import { getCoaches } from "../../../api/users.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { generateTeamRosterPdf } from "../../../utils/teamRosterPdf.js";
import { useToast } from "../../../context/ToastContext.js";
import logo from "../../../assets/logo.png";

const storageKey = (teamId) => `huskies:roster-booklet:${teamId}`;

// Remembered per team, in this browser only. Wrapped in try/catch because
// storage can be blocked or empty.
function loadSaved(teamId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(teamId))) || {};
  } catch {
    return {};
  }
}

// The season runs fall to summer, so from July on it is "this year to next".
function defaultSeason(now = new Date()) {
  const year = now.getFullYear();
  return now.getMonth() >= 6 ? `${year}-${year + 1} Season` : `${year - 1}-${year} Season`;
}

const staffLine = (c) => [c.name, c.phone || "", c.email || ""].join(" | ");

function parseStaff(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, phone, email] = line.split("|").map((part) => (part || "").trim());
      return { name, phone, email };
    });
}

function RosterBookletModal({ team, players, token, onClose }) {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const saved = loadSaved(team._id);

  // The public Coaching Staff list already carries each coach's phone and
  // email, so it pre-fills the staff box the first time.
  const { data: coaches = [] } = useQuery({
    queryKey: queryKeys.coaches(),
    queryFn: getCoaches,
  });
  const defaultStaff = coaches
    .filter((c) => c.teamId?.name === team.name)
    .map(staffLine)
    .join("\n");

  const [season, setSeason] = useState(saved.season ?? defaultSeason());
  const [eventsHeading, setEventsHeading] = useState(saved.eventsHeading ?? "Upcoming Events");
  const [events, setEvents] = useState(saved.events ?? "");
  const [staffText, setStaffText] = useState(saved.staffText ?? null);
  const staffValue = staffText ?? defaultStaff;
  const [teamName, setTeamName] = useState(saved.teamName ?? `Empire State Huskies ${team.name} ${team.ageGroup}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      try {
        localStorage.setItem(
          storageKey(team._id),
          JSON.stringify({ season, eventsHeading, events, staffText: staffValue, teamName })
        );
      } catch {
        // Not being able to remember the details isn't worth failing the download.
      }

      // Phone and email are private, so they come from a coach/admin-only
      // request instead of the public roster.
      const details = await getTeamShowcaseDetails(team._id, token);
      const byPlayer = new Map(details.map((d) => [String(d.playerId), d]));
      const merged = players.map((player) => ({ ...player, ...(byPlayer.get(String(player._id)) || {}) }));

      await generateTeamRosterPdf({
        teamName: teamName.trim(),
        season: season.trim(),
        eventsHeading: eventsHeading.trim(),
        events: events.split("\n").map((l) => l.trim()).filter(Boolean),
        staff: parseStaff(staffValue),
        logoUrl: logo,
        players: merged,
      });
      onClose();
    } catch (error) {
      pushToast({ type: "error", message: error?.message || "Couldn't create the roster." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="profile__overlay" onClick={onClose}>
      <div className="profilePlayer__container" onClick={(e) => e.stopPropagation()}>
        <button className="profile__modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="profile__edit-title">Team Roster PDF</h2>
        <p className="profile__empty-hint">
          Player cards come from each profile. The last page uses what you enter here, which is
          remembered on this computer for next time.
        </p>
        <form className="profile__edit-form" onSubmit={handleSubmit}>
          <label className="profile__edit-label">
            Team name on the last page
            <input className="profile__edit-input" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          </label>
          <label className="profile__edit-label">
            Season
            <input className="profile__edit-input" value={season} onChange={(e) => setSeason(e.target.value)} />
          </label>
          <label className="profile__edit-label">
            Events list title
            <input
              className="profile__edit-input"
              value={eventsHeading}
              onChange={(e) => setEventsHeading(e.target.value)}
              placeholder="e.g. Summer 2026"
            />
          </label>
          <label className="profile__edit-label">
            Events (one per line, like "JUNE 6-7: Jersey Outlaws Showcase, Jackson NJ")
            <textarea
              className="profile__edit-input"
              rows={5}
              value={events}
              onChange={(e) => setEvents(e.target.value)}
            />
          </label>
          <label className="profile__edit-label">
            Coaching staff (one per line: Name | Phone | Email)
            <textarea
              className="profile__edit-input"
              rows={4}
              value={staffValue}
              onChange={(e) => setStaffText(e.target.value)}
            />
          </label>
          <div className="profile__edit-actions">
            <button type="button" className="profile__edit-cancel" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="profile__edit-save" disabled={busy}>
              {busy ? "Creating…" : "Download PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RosterBookletModal;
