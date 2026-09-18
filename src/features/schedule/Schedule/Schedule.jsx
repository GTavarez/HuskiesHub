import React, { useState, useMemo, useContext } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useQuery } from "@tanstack/react-query";
import { getSchedule } from "../../../api/schedule";
import { getEvents } from "../../../api/events.js";
import { getTeams } from "../../../api/teams.js";
import { queryKeys } from "../../../api/queryKeys";
import { apiBaseUrl } from "../../../utils/config.js";
import CurrentUserContext from "../../../context/CurrentUserContext";
import GameCard from "./GameCard/GameCard.jsx";
import EventCard from "./EventCard/EventCard.jsx";
import DayAgendaModal from "./DayAgendaModal/DayAgendaModal.jsx";
import LessonSlotBooking from "../../shared/LessonSlotBooking/LessonSlotBooking.jsx";
import "./Schedule.css";

// Practice/bullpen events (type !== "game") are drawn in this color so
// they're visually distinct from Google-Calendar-sourced games on the grid.
const TEAM_EVENT_COLOR = "#64b5f6";
const CANCELLED_EVENT_COLOR = "#e57373";

function Schedule() {
  const currentUser = useContext(CurrentUserContext);
  const token = localStorage.getItem("jwt");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeamEvent, setSelectedTeamEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAllTeams, setShowAllTeams] = useState(false);

  // Admins see every team's practices/bullpens at once; everyone else sees
  // only their own team's (a parent's team is inferred from their first
  // linked child, matching the pattern already used in ParentDashboard).
  const isAdmin = currentUser?.role === "admin";
  const isCoach = currentUser?.role === "coach";
  const ownTeamId =
    currentUser?.teamId || currentUser?.childrenData?.[0]?.teamId || null;
  const canSeeTeamEvents = Boolean(currentUser) && (isAdmin || Boolean(ownTeamId));
  const eventsTeamId = isAdmin ? null : ownTeamId;
  const eventsQueryKeyId = eventsTeamId || "all";

  const { data: teams = [] } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });
  const teamNameById = useMemo(() => new Map(teams.map((t) => [t._id, t.name])), [teams]);

  // Every team a parent's linked children play on (not just the first —
  // families with kids on different teams shouldn't lose games for the
  // others), or the single team a coach/player belongs to. Empty for admins
  // (who already see everything) and for anyone without a resolvable team.
  const myTeamIds = useMemo(() => {
    if (!currentUser || isAdmin) return [];
    if (["coach", "player"].includes(currentUser.role) && currentUser.teamId) {
      return [currentUser.teamId];
    }
    if (currentUser.role === "parent") {
      return [...new Set((currentUser.childrenData || []).map((c) => c.teamId).filter(Boolean))];
    }
    return [];
  }, [currentUser, isAdmin]);
  const myTeamNames = useMemo(
    () => myTeamIds.map((id) => teamNameById.get(id)).filter(Boolean),
    [myTeamIds, teamNameById]
  );
  const canFilterToMyTeams = myTeamNames.length > 0;

  const {
    data: games = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.schedule(),
    queryFn: getSchedule,
    select: (data) => {
      const expanded = [];
      data.forEach((game) => {
        const isAllDay = !game.start?.dateTime;
        const location = game.location || "Location TBA";

        if (!isAllDay) {
          expanded.push({
            id: `game-${game.id}`,
            title: game.summary,
            start: game.start.dateTime,
            end: game.end?.dateTime,
            extendedProps: { kind: "game", location },
          });
          return;
        }

        // All-day multi-day entries (e.g. a 2-day tournament weekend) use an
        // EXCLUSIVE end date. Rendering them as one bar spanning cell
        // boundaries doesn't work here — this calendar's per-day "card"
        // styling (gaps, rounded borders between cells) makes the bar
        // visually collide with the next day's card. Expanding into one
        // independent single-day entry per covered day keeps every day's
        // copy fully contained in its own card while still showing the
        // event on each day it actually covers. Local-time parsing (no "Z"/
        // offset in the string) avoids shifting a day in timezones behind UTC.
        const dayCursor = new Date(`${game.start.date}T00:00:00`);
        const endBoundary = new Date(`${game.end.date}T00:00:00`);
        let dayIndex = 0;
        while (dayCursor < endBoundary) {
          const y = dayCursor.getFullYear();
          const m = String(dayCursor.getMonth() + 1).padStart(2, "0");
          const d = String(dayCursor.getDate()).padStart(2, "0");
          expanded.push({
            id: `game-${game.id}-${dayIndex}`,
            title: game.summary,
            start: `${y}-${m}-${d}`,
            extendedProps: { kind: "game", location },
          });
          dayCursor.setDate(dayCursor.getDate() + 1);
          dayIndex += 1;
        }
      });
      return expanded;
    },
  });

  const { data: teamEvents = [] } = useQuery({
    queryKey: queryKeys.events(eventsQueryKeyId),
    queryFn: () => getEvents(eventsTeamId, token),
    enabled: Boolean(token) && canSeeTeamEvents,
  });

  // Games (Google Calendar) aren't tagged with a real teamId, only a title
  // like "12U — ..." — same best-effort name match the .ics feed uses.
  // Filtered by default whenever we can resolve the viewer's team(s), with a
  // toggle to fall back to the unfiltered "every team" view.
  const applyTeamFilter = canFilterToMyTeams && !showAllTeams;
  const visibleGames = useMemo(() => {
    if (!applyTeamFilter) return games;
    return games.filter((g) =>
      myTeamNames.some((name) => g.title.toLowerCase().includes(name.toLowerCase()))
    );
  }, [games, applyTeamFilter, myTeamNames]);

  const teamCalendarEvents = useMemo(
    () =>
      teamEvents.map((event) => {
        const isCancelled = event.status === "cancelled";
        const color = isCancelled ? CANCELLED_EVENT_COLOR : TEAM_EVENT_COLOR;
        return {
          id: `event-${event._id}`,
          title: isCancelled ? `CANCELLED: ${event.title}` : event.title,
          start: event.startsAt,
          end: event.endsAt,
          backgroundColor: color,
          borderColor: color,
          extendedProps: { kind: "teamEvent", eventId: event._id },
        };
      }),
    [teamEvents]
  );

  const calendarEvents = useMemo(
    () => [...visibleGames, ...teamCalendarEvents],
    [visibleGames, teamCalendarEvents]
  );

  const handleEventClick = (info) => {
    const { extendedProps } = info.event;

    if (extendedProps.kind === "teamEvent") {
      const event = teamEvents.find((e) => e._id === extendedProps.eventId);
      if (event) setSelectedTeamEvent(event);
      return;
    }

    const clickedEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      location: extendedProps.location,
    };
    setSelectedEvent(clickedEvent);
    setIsModalOpen(true);
  };

  const handleDateClick = (info) => {
    setSelectedDay(info.date);
  };

  const handleSelectGameFromAgenda = (game) => {
    setSelectedDay(null);
    setSelectedEvent({
      id: game.id,
      title: game.title,
      start: game.start,
      end: game.end,
      location: game.extendedProps?.location,
    });
    setIsModalOpen(true);
  };

  const handleSelectTeamEventFromAgenda = (event) => {
    setSelectedDay(null);
    setSelectedTeamEvent(event);
  };

  return (
    <section className="schedule">
      <h2 className="schedule__title">Team Schedule</h2>

      {isLoading && (
        <p style={{ textAlign: "center", color: "#ccc" }}>
          Loading schedule...
        </p>
      )}

      {isError && (
        <p style={{ textAlign: "center", color: "#f2b8b5" }}>
          {error?.message || "Failed to load schedule."}
        </p>
      )}

      {canFilterToMyTeams && (
        <label className="schedule__filter-toggle">
          <input
            type="checkbox"
            checked={showAllTeams}
            onChange={(e) => setShowAllTeams(e.target.checked)}
          />
          Show every team's games (not just {myTeamNames.join(" & ")})
        </label>
      )}

      {myTeamIds.length > 0 && (
        <div className="schedule__ics-links">
          <p className="schedule__ics-label">
            📅 Sync to your phone's calendar (auto-updates as the schedule changes):
          </p>
          {myTeamIds.map((id) => {
            const url = `${apiBaseUrl}/api/schedule/ics?teamId=${id}`;
            return (
              <div key={id} className="schedule__ics-row">
                <a href={url.replace(/^https?:/, "webcal:")} className="schedule__ics-btn">
                  Add {teamNameById.get(id) || "team"} schedule
                </a>
                <span className="schedule__ics-url">{url}</span>
              </div>
            );
          })}
          <p className="schedule__ics-hint">
            On iPhone, tap the button above. On Android/Google Calendar, copy the link and use
            Google Calendar → Settings → Add calendar → From URL.
          </p>
        </div>
      )}

      <div className="schedule__calendar-scroll">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          dayMaxEvents={3}
          height="auto"
        />
      </div>

      {isModalOpen && selectedEvent && (
        <GameCard game={selectedEvent} onClose={() => setIsModalOpen(false)} />
      )}

      {selectedTeamEvent && (
        <EventCard
          event={selectedTeamEvent}
          currentUser={currentUser}
          token={token}
          queryTeamId={eventsQueryKeyId}
          onClose={() => setSelectedTeamEvent(null)}
        />
      )}

      {selectedDay && (
        <DayAgendaModal
          date={selectedDay}
          games={visibleGames}
          teamEvents={teamEvents}
          isAdmin={isAdmin}
          coachTeamId={isCoach ? ownTeamId : null}
          coachTeamName={isCoach ? teamNameById.get(ownTeamId) : null}
          token={token}
          onSelectGame={handleSelectGameFromAgenda}
          onSelectTeamEvent={handleSelectTeamEventFromAgenda}
          onClose={() => setSelectedDay(null)}
        />
      )}

      <div className="schedule__ics-links schedule__ics-links--footer">
        <p className="schedule__ics-label">
          📅 Add this schedule to your phone (auto-updates as it changes):
        </p>
        <div className="schedule__ics-row">
          <a
            href={`${apiBaseUrl}/api/schedule/ics`.replace(/^https?:/, "webcal:")}
            className="schedule__ics-btn"
          >
            Add Full Schedule to Calendar
          </a>
        </div>
        <p className="schedule__ics-hint">
          On iPhone/iPad, tap the button and choose "Subscribe" when prompted. On Android or
          desktop, open Google Calendar → Settings → Add calendar → From URL and paste:{" "}
          <span className="schedule__ics-url">{`${apiBaseUrl}/api/schedule/ics`}</span>
        </p>
      </div>

      <div style={{ marginTop: 48 }}>
        <LessonSlotBooking title="Private Lesson Slots" />
      </div>
    </section>
  );
}

export default Schedule;
