import { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getEvents } from "../../../api/events.js";
import { getTeams } from "../../../api/teams.js";
import { getAnnouncements } from "../../../api/announcements.js";
import { getDocuments, downloadDocumentBlobUrl } from "../../../api/documents.js";
import { queryKeys } from "../../../api/queryKeys.js";
import { resolveMediaUrl } from "../../../utils/media.js";
import { sortEventsForAttendance } from "../../../utils/eventSort.js";
import RsvpControl from "../RsvpControl/RsvpControl.jsx";
import PaymentsPanel from "../../payments/PaymentsPanel/PaymentsPanel.jsx";
import RecruitingProfileEditor from "../../recruiting/RecruitingProfileEditor/RecruitingProfileEditor.jsx";
import PerformanceProgress from "../../performance/PerformanceProgress/PerformanceProgress.jsx";
import AiAssistant from "../../analytics/AiAssistant/AiAssistant.jsx";
import "../../shared/portal.css";

function ParentDashboard({ currentUser, token }) {
  const children = currentUser?.childrenData || [];
  // A family can have kids on more than one team (e.g. 12U + Premier), and
  // emails already go out for every one of them — so the dashboard has to
  // show every team's schedule, announcements and documents, not just the
  // first child's.
  const teamIds = [
    ...new Set(
      [currentUser?.teamId, ...children.map((child) => child.teamId)]
        .filter(Boolean)
        .map(String)
    ),
  ];
  const teamId = teamIds[0];
  const [recruitingPlayerId, setRecruitingPlayerId] = useState(children[0]?._id || "");

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    enabled: teamIds.length > 1,
  });
  const teamNameById = new Map(teams.map((team) => [String(team._id), team.name]));
  const showTeamLabels = teamIds.length > 1;

  const eventQueries = useQueries({
    queries: teamIds.map((id) => ({
      queryKey: queryKeys.events(id),
      queryFn: () => getEvents(id, token),
      enabled: Boolean(token),
    })),
  });
  const announcementQueries = useQueries({
    queries: teamIds.map((id) => ({
      queryKey: queryKeys.announcements(id),
      queryFn: () => getAnnouncements(id, token),
      enabled: Boolean(token),
    })),
  });
  const documentQueries = useQueries({
    queries: teamIds.map((id) => ({
      queryKey: queryKeys.documents(id),
      queryFn: () => getDocuments(id, token),
      enabled: Boolean(token),
    })),
  });

  // Organization-wide announcements/documents come back once per team, so
  // dedupe by id before showing them.
  const mergeUnique = (queries) => {
    const seen = new Map();
    queries.forEach((query) => (query.data || []).forEach((item) => seen.set(item._id, item)));
    return [...seen.values()];
  };
  const events = sortEventsForAttendance(mergeUnique(eventQueries));
  const announcements = mergeUnique(announcementQueries).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const documents = mergeUnique(documentQueries);

  const handleDownload = async (doc) => {
    const url = await downloadDocumentBlobUrl(doc._id, token);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!teamId) {
    return (
      <section className="portal">
        <div className="portal__panel">
          <h1 className="portal__title">Parent Portal</h1>
          <p className="portal__subtitle">
            No team is linked to your account yet. Contact your club admin to
            get connected to your child&apos;s team.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="portal">
      <div className="portal__panel">
        <h1 className="portal__title">Parent Portal</h1>
        <p className="portal__subtitle">
          Upcoming practices, games, and club updates.
        </p>

        <div className="portal__section">
          <h2 className="portal__section-title">Ask HuskiesHub</h2>
          <AiAssistant context="parent" token={token} />
        </div>

        <div className="portal__section">
          <h2 className="portal__section-title">Schedule &amp; RSVP</h2>
          {events.length === 0 && (
            <p className="portal__empty">No upcoming events yet.</p>
          )}
          {events.map((event) => (
            <div key={event._id} className="portal__card">
              <div className="portal__card-header">
                <span className={`portal__badge portal__badge--${event.type}`}>
                  {event.type}
                </span>
                {event.status === "cancelled" && (
                  <span
                    className="portal__badge"
                    style={{ background: "rgba(229, 115, 115, 0.25)", color: "#e57373" }}
                  >
                    cancelled
                  </span>
                )}
                <strong>{event.title}</strong>
              </div>
              <p className="portal__card-meta">
                {new Date(event.startsAt).toLocaleString()}
                {event.location ? ` · ${event.location}` : ""}
              </p>
              {event.status !== "cancelled" && (
                <RsvpControl
                  event={event}
                  currentUserId={currentUser._id}
                  token={token}
                  teamId={String(event.teamId)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="portal__section">
          <h2 className="portal__section-title">Announcements</h2>
          {announcements.length === 0 && (
            <p className="portal__empty">No announcements yet.</p>
          )}
          {announcements.map((announcement) => (
            <div key={announcement._id} className="portal__card">
              <strong>{announcement.title}</strong>
              <p className="portal__card-body">{announcement.body}</p>
              {announcement.imageUrl && (
                <img
                  src={resolveMediaUrl(announcement.imageUrl)}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, marginTop: 8 }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="portal__section">
          <h2 className="portal__section-title">Registration &amp; Payments</h2>
          <PaymentsPanel currentUser={currentUser} token={token} />
        </div>

        {children.length > 0 && (
          <div className="portal__section">
            <h2 className="portal__section-title">Recruiting Profile</h2>
            {children.length > 1 && (
              <>
                <label className="portal__label" htmlFor="recruiting-player">
                  Player
                </label>
                <select
                  id="recruiting-player"
                  className="portal__select"
                  value={recruitingPlayerId}
                  onChange={(e) => setRecruitingPlayerId(e.target.value)}
                >
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {recruitingPlayerId && (
              <RecruitingProfileEditor
                playerId={recruitingPlayerId}
                token={token}
                player={children.find((child) => child._id === recruitingPlayerId)}
              />
            )}
          </div>
        )}

        {children.length > 0 && recruitingPlayerId && (
          <div className="portal__section">
            <h2 className="portal__section-title">Performance Progress</h2>
            <PerformanceProgress playerId={recruitingPlayerId} token={token} />
          </div>
        )}

        <div className="portal__section">
          <h2 className="portal__section-title">Documents</h2>
          {documents.length === 0 && (
            <p className="portal__empty">No documents shared yet.</p>
          )}
          {documents.map((doc) => (
            <div key={doc._id} className="portal__card portal__card--row">
              <span>{doc.title}</span>
              <button
                type="button"
                className="portal__link-button"
                onClick={() => handleDownload(doc)}
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ParentDashboard;
