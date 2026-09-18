import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTeams } from "../../../api/teams";
import { queryKeys } from "../../../api/queryKeys";
import clubLogo from "../../../assets/logo.png";
import "./Teams.css";

// Youngest-to-oldest by age group, with Premier (the top travel team) shown
// last rather than wherever it happens to sort alphabetically. Any future
// team not in this list just falls in after the ones that are.
const TEAM_ORDER = ["12U", "14U", "16U", "18U Gold", "Premier"];

function Teams() {
  const {
    data: teams = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    select: (data) =>
      [...data].sort((a, b) => {
        const aIndex = TEAM_ORDER.indexOf(a.name);
        const bIndex = TEAM_ORDER.indexOf(b.name);
        return (aIndex === -1 ? TEAM_ORDER.length : aIndex) -
          (bIndex === -1 ? TEAM_ORDER.length : bIndex);
      }),
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
                src={team.banner || clubLogo}
                alt={`${team.name} banner`}
                className={team.banner ? "" : "team__banner-img--placeholder"}
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
