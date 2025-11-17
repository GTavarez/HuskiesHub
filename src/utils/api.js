import { get } from "mongoose";
import { baseUrl } from "./constants.js";

function checkResponse(res) {
  return res.ok ? res.json() : Promise.reject(`Error:${res.status}`);
}
// Generic request helper
function request(url, options) {
  return fetch(url, options).then((res) =>
    res.ok ? res.json() : Promise.reject(`Error: ${res.status}`)
  );
}

// Functions for schedule management
function getSchedule() {
  return fetch(`${baseUrl}/api/schedule`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(checkResponse);
}
/* function createGame({ title, date, time, location }) {
  return fetch(`${baseUrl}/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, date, time, location }),
  }).then(checkResponse);
} */
/*function deleteGame(scheduleId) {
  return fetch(`${baseUrl}/schedules/${scheduleId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(checkResponse);
}
//
function getPlayers() {
  return fetch(`${baseUrl}/players`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(checkResponse);
}
function createPlayer({ name, position, number, team }) {
  return fetch(`${baseUrl}/players`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, position, number, team }),
  }).then(checkResponse);
}
function getPlayerById(playerId) {
  return fetch(`${baseUrl}/players/${playerId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(checkResponse);
} */

// get weather API
export function getWeather(lat, lon) {
  const apiKey = import.meta.env.VITE_WeatherAPIKey;
  return fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
  ).then(checkResponse);
}

// Exporting the functions for external use
export { getSchedule, checkResponse };
