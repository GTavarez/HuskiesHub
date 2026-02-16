import { apiFetch } from "./client";

const getTeams = () => apiFetch("/api/teams");
const getTeam = (teamId) => apiFetch(`/api/teams/${teamId}`);
const getTeamPlayers = (teamId) => apiFetch(`/api/players/team/${teamId}`);

export { getTeams, getTeam, getTeamPlayers };
