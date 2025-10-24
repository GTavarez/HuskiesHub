import React, { useState, useEffect } from "react";
/* import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "@fullcalendar/daygrid/main.css"; */
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchGoogleEvents() {
      const gapi = window.gapi;
      if (!gapi?.client?.calendar) return;

      try {
        const response = await gapi.client.calendar.events.list({
          calendarId: "primary",
          timeMin: new Date().toISOString(),
          showDeleted: false,
          singleEvents: true,
          maxResults: 20,
          orderBy: "startTime",
        });

        const googleEvents = response.result.items.map((event) => ({
          
          title: event.summary,
          start: event.start.dateTime || event.start.date,
          end: event.end?.dateTime || event.end?.date,
          
        }));
        
        setEvents(googleEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    }

    fetchGoogleEvents();
  }, []);
    
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">My Calendar</h2>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
      />
    </div>
  );
}

export default Calendar;
