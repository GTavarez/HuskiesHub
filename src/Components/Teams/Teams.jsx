import { Link } from "react-router-dom";
import { playersData } from "../../utils/constants";
import "./Teams.css";

function Teams() {
  return (
    <section className="teams__section">
      <div className="teams__header">
        <h2>Empire State Huskies Teams</h2>
        <div className="teams__divider"></div>
      </div>

      <div className="teams__grid">
        {playersData.map((team) => (
          <Link key={team._id} to={`/teams/${team._id}`} className="team__card">
            <div className="team__banner">
              <img
                src={team.banner || "/assets/team2.jpg"}
                alt={`${team.name} banner`}
              />
            </div>
            <div className="team__content">
              <h3>{team.name}</h3>
              <p className="team__age">Age Group: {team.ageGroup}</p>
              <p className="team__count">{team.players.length} Players</p>
              <button className="team__btn">View Team</button>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Teams;
