import { apiFetch } from "./client";

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const getTeams = () => apiFetch("/api/teams");
const getTeam = (teamId) => apiFetch(`/api/teams/${teamId}`);
const getTeamPlayers = (teamId) => apiFetch(`/api/players/team/${teamId}`);
const updateTeam = (teamId, payload, token) =>
  apiFetch(`/api/teams/${teamId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

export { getTeams, getTeam, getTeamPlayers, updateTeam };
