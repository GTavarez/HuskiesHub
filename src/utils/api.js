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
function getSchedules() {
  return fetch(`${baseUrl}/schedules`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then(checkResponse);
}
function createGame({ title, date, time, location }) {
  return fetch(`${baseUrl}/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, date, time, location }),
  }).then(checkResponse);
}
function deleteGame(scheduleId) {
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
}
// Exporting the functions for external use
export default {
  checkResponse,
  request,
  getSchedules,
  createGame,
  deleteGame,
  getPlayers,
  createPlayer,
  getPlayerById,
};
