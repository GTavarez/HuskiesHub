import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useQuery } from "@tanstack/react-query";
import { getSchedule } from "../../../api/schedule";
import { queryKeys } from "../../../api/queryKeys";
import GameCard from "./GameCard/GameCard.jsx";
import "./Schedule.css";

function Schedule() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: events = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.schedule(),
    queryFn: getSchedule,
    select: (data) =>
      data.map((game) => ({
        id: game.id,
        title: game.summary,
        start: game.start?.dateTime || game.start?.date,
        end: game.end?.dateTime || game.end?.date,
        location: game.location || "Location TBA",
      })),
  });

  const handleEventClick = (info) => {
    const clickedEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      location: info.event.extendedProps.location,
    };
    setSelectedEvent(clickedEvent);
    setIsModalOpen(true);
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

      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
      />

      {isModalOpen && selectedEvent && (
        <GameCard game={selectedEvent} onClose={() => setIsModalOpen(false)} />
      )}
    </section>
  );
}

export default Schedule;
