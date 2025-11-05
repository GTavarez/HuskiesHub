import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "./Schedule.css";

const CLIENT_ID = import.meta.env.VITE_ClientID;
const API_KEY = import.meta.env.VITE_CalendarAPIKey;
const DISCOVERY_DOC = import.meta.env.VITE_DiscoveryDoc;
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

export default function Schedule() {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    loadGapi();
    loadGis();
  }, []);

  const loadGapi = () => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => window.gapi.load("client", initGapiClient);
    document.body.appendChild(script);
  };

  const loadGis = () => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => initGisClient();
    document.body.appendChild(script);
  };

  async function initGapiClient() {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setGapiLoaded(true);
  }

  function initGisClient() {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => handleAuth(resp),
    });
    setTokenClient(client);
    setGisLoaded(true);
  }

  async function handleAuth(resp) {
    if (resp.error) return;
    setIsAuthorized(true);
    await loadEvents();
  }

  const handleAuthorize = () => {
    if (!tokenClient) return;
    tokenClient.requestAccessToken({ prompt: "consent" });
  };

  const loadEvents = async () => {
    const res = await window.gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const formatted = res.result.items.map((event) => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end?.dateTime || event.end?.date,
    }));
    setEvents(formatted);
  };

  return (
    <section className="schedule">
      <h2 className="schedule__title">Team Schedule</h2>
      <div className="schedule__actions">
        <button
          onClick={handleAuthorize}
          disabled={!gapiLoaded || !gisLoaded}
          className="schedule__btn"
        >
          {isAuthorized ? "Refresh Schedule" : "Connect Google Calendar"}
        </button>
      </div>

      {isAuthorized ? (
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
        />
      ) : (
        <p className="schedule__message">
          Please connect your calendar to view events.
        </p>
      )}
    </section>
  );
}
