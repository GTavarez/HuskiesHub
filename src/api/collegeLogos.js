import { apiFetch } from "./client";

const getCollegeLogos = () => apiFetch("/api/college-logos");

const getCommittedPlayers = () => apiFetch("/api/players/committed");

const uploadCollegeLogo = ({ college, playerId, file }, token) => {
  const body = new FormData();
  body.append("logo", file);
  body.append("college", college);
  if (playerId) body.append("playerId", playerId);
  return apiFetch("/api/college-logos", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
};

export { getCollegeLogos, getCommittedPlayers, uploadCollegeLogo };
