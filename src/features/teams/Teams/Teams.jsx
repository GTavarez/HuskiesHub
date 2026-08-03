import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams";
import { queryKeys } from "../../../api/queryKeys";
import "./Teams.css";

function Teams() {
  const {
    data: teams = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
  });

  return (
    <section className="teams__section">
      <div className="teams__header">
        <h2>Empire State Huskies Teams</h2>
        <div className="teams__divider"></div>
      </div>

      {isLoading && (
        <p style={{ textAlign: "center", color: "#ccc" }}>
          Loading teams...
        </p>
      )}

      {isError && (
        <p style={{ textAlign: "center", color: "#f2b8b5" }}>
          {error?.message || "Failed to load teams."}
        </p>
      )}

      <div className="teams__grid">
        {teams.map((team) => (
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
              <button className="team__btn">View Team</button>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default Teams;
