import React, { useEffect, useState } from "react";
import "./App.css";
import Calendar from "../Calendar/Calendar";

const CLIENT_ID = import.meta.env.VITE_ClientID;

const API_KEY = import.meta.env.VITE_CalendarAPIKey;
const DISCOVERY_DOC = import.meta.env.VITE_DiscoveryDoc;
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

export default function GoogleCalendarQuickstart() {
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [events, setEvents] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Load Google API scripts dynamically
  useEffect(() => {
    const loadGapi = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load("client", initializeGapiClient);
      };
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

  // Initialize GAPI (client + discovery docs)
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

  // Handle sign-in
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

  // Handle sign-out
  const handleSignout = () => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken("");
      setEvents([]);
      setIsAuthorized(false);
    }
  };

  // Fetch events
  async function listUpcomingEvents() {
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: "startTime",
      });

      const items = response.result.items || [];
      setEvents(items);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Google Calendar API Quickstart</h2>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={handleAuthorize}
          disabled={!gapiLoaded || !gisLoaded}
          style={{ marginRight: "1rem" }}
        >
          {isAuthorized ? "Refresh" : "Authorize"}
        </button>

        <button onClick={handleSignout} disabled={!isAuthorized}>
          Sign Out
        </button>
      </div>
      <div>
        {!isAuthorized && (
          <p>Click “Authorize” to connect to your Google Calendar.</p>
        )}

        {isAuthorized && events.length === 0 && <p>No events found.</p>}

        {isAuthorized && events.length > 0 && (
          <div>
            <Calendar />
            <h3>Upcoming Events:</h3>
            <ul>
              {events.map((event) => (
                <li key={event.id}>
                  <strong>{event.summary}</strong> —{" "}
                  {event.start.dateTime || event.start.date}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
