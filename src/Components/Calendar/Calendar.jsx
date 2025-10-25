import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import "@fullcalendar/daygrid";

const CLIENT_ID = import.meta.env.VITE_ClientID;
const API_KEY = import.meta.env.VITE_CalendarAPIKey;
const DISCOVERY_DOC = import.meta.env.VITE_DiscoveryDoc;
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

export default function GoogleCalendar() {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Load Google API scripts
  useEffect(() => {
    const loadGapi = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => window.gapi.load("client", initializeGapiClient);
      document.body.appendChild(script);
    };

    const loadGis = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGisClient();
      document.body.appendChild(script);
    };

    loadGapi();
    loadGis();
  }, []);

  // Initialize GAPI client
  async function initializeGapiClient() {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    setGapiLoaded(true);
  }

  // Initialize Google Identity Services
  function initializeGisClient() {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => handleAuthResponse(resp),
    });
    setTokenClient(client);
    setGisLoaded(true);
  }

  // Handle auth response
  async function handleAuthResponse(resp) {
    if (resp.error) {
      console.error(resp);
      return;
    }
    setIsAuthorized(true);
    await listUpcomingEvents();
  }

  // Sign in
  const handleAuthorize = () => {
    if (!tokenClient) return;
    tokenClient.callback = async (resp) => {
      if (resp.error) throw resp;
      setIsAuthorized(true);
      await listUpcomingEvents();
    };
    const token = window.gapi.client.getToken();
    if (!token) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  };

  // Sign out
  const handleSignout = () => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken("");
      setEvents([]);
      setIsAuthorized(false);
    }
  };

  // Fetch and format Google Calendar events
  async function listUpcomingEvents() {
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 20,
        orderBy: "startTime",
      });

      const items = response.result.items || [];
      const formattedEvents = items.map((event) => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end?.dateTime || event.end?.date,
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  }

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-semibold mb-4">Team Schedule</h2>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={handleAuthorize}
          disabled={!gapiLoaded || !gisLoaded}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {isAuthorized ? "Refresh" : "Connect Calendar"}
        </button>

        {isAuthorized && (
          <button
            onClick={handleSignout}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Sign Out
          </button>
        )}
      </div>

      {!isAuthorized && (
        <p className="text-gray-600">
          Connect your Google Calendar to view your team’s schedule.
        </p>
      )}

      {isAuthorized && (
        <div className="max-w-5xl mx-auto">
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            height="auto"
          />
        </div>
      )}
    </div>
  );
}
