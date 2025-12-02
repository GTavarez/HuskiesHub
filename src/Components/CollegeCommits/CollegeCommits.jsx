import React from "react";
import "./CollegeCommits.css";
import { playersData } from "../../utils/constants";

function CollegeCommits() {
  const committedPlayers = playersData.flatMap((team) =>
    team.players.filter((player) => player.isCommitted)
  );
  const cleanImage = (str) => {
    if (!str) return "default";

    // remove .jpg anywhere
    const withoutExt = str.replace(".jpg", "");

    // if already full URL:
    if (withoutExt.startsWith("http")) return withoutExt + ".jpg";

    // otherwise add backend
    return `https://huskieshub-backend-891073803869-us-central1.run.app/images/${withoutExt}.jpg`;
  };

  return (
    <section className="commits">
      <div className="commits__header">
        <h2>College Commitments</h2>
        <div className="commits__divider"></div>
      </div>

      {committedPlayers.length === 0 ? (
        <p className="commits__empty">No college commitments yet.</p>
      ) : (
        <div className="commits__grid">
          {committedPlayers.map((player) => (
            <div key={player._id} className="commit__card">
              <img
                src={cleanImage(player.image) || "/default.avif"}
                alt={player.name}
                className="commit__image"
              />
              <h3 className="commit__name">{player.name}</h3>
              <p className="commit__details">
                #{player.jersey} | {player.position} | {player.gradYear}
              </p>
              <p className="commit__college">
                🎓 Committed To: <span>{player.committedCollege || "TBA"}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CollegeCommits;
