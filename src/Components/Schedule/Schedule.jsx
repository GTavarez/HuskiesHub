import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { getSchedule } from "../../utils/api";
import GameCard from "../Schedule/GameCard/GameCard.jsx";
import "./schedule.css";

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
          start: game.start.dateTime || game.start.date,
          end: game.end?.dateTime || game.end?.date,
          location: game.location,
        }));
        setEvents(formatted);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
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

      {isModalOpen && (
        <GameCard event={selectedEvent} onClose={() => setIsModalOpen(false)} />
      )}
    </section>
  );
}

export default Schedule;
