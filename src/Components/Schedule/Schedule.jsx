import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getSchedule } from "../../utils/api";
import GameCard from "../Schedule/GameCard/GameCard.jsx";
import "./Schedule.css";

function Schedule() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    getSchedule()
      .then((data) => {
        const formatted = data.map((game) => ({
          id: game.id,
          title: game.summary,
          start: game.start?.dateTime || game.start?.date,
          end: game.end?.dateTime || game.end?.date,
          location: game.location || "Location TBA",
        }));
        setEvents(formatted);
      })
      .catch((err) => console.error("Error fetching schedule:", err));
  }, []);

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
