import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "../../../api/events.js";
import { getAnnouncements } from "../../../api/announcements.js";
import { getDocuments, downloadDocumentBlobUrl } from "../../../api/documents.js";
import { queryKeys } from "../../../api/queryKeys.js";
import RsvpControl from "../RsvpControl/RsvpControl.jsx";
import PaymentsPanel from "../../payments/PaymentsPanel/PaymentsPanel.jsx";
import RecruitingProfileEditor from "../../recruiting/RecruitingProfileEditor/RecruitingProfileEditor.jsx";
import PerformanceProgress from "../../performance/PerformanceProgress/PerformanceProgress.jsx";
import AiAssistant from "../../analytics/AiAssistant/AiAssistant.jsx";
import "../../shared/portal.css";

function ParentDashboard({ currentUser, token }) {
  const teamId = currentUser?.teamId || currentUser?.childrenData?.[0]?.teamId;
  const children = currentUser?.childrenData || [];
  const [recruitingPlayerId, setRecruitingPlayerId] = useState(children[0]?._id || "");

  const { data: events = [] } = useQuery({
    queryKey: queryKeys.events(teamId),
    queryFn: () => getEvents(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const { data: announcements = [] } = useQuery({
    queryKey: queryKeys.announcements(teamId),
    queryFn: () => getAnnouncements(teamId, token),
    enabled: Boolean(teamId && token),
  });

  const { data: documents = [] } = useQuery({
    queryKey: queryKeys.documents(teamId),
    queryFn: () => getDocuments(teamId, token),
    enabled: Boolean(teamId && token),
  });

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
                <strong>{event.title}</strong>
              </div>
              <p className="portal__card-meta">
                {new Date(event.startsAt).toLocaleString()}
                {event.location ? ` · ${event.location}` : ""}
              </p>
              <RsvpControl
                event={event}
                currentUserId={currentUser._id}
                token={token}
                teamId={teamId}
              />
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
              <RecruitingProfileEditor playerId={recruitingPlayerId} token={token} />
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
