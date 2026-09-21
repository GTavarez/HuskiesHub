import { useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import "./CollegeCommits.css";
import { playersData } from "../../../utils/constants";
import { resolveImageUrl } from "../../../utils/media.js";
import { getCommittedPlayers } from "../../../api/collegeLogos.js";
import { queryKeys } from "../../../api/queryKeys.js";
import CurrentUserContext from "../../../context/CurrentUserContext.js";
import CollegeLogo, { CollegeLogoUpload } from "../../shared/CollegeLogo/CollegeLogo.jsx";

const nameKey = (name) => String(name || "").trim().toLowerCase();

// "default.avif" is a placeholder name that has no file behind it, so treat it
// (and a missing photo) as "no photo" and show the player's initial instead.
const hasPhoto = (player) => Boolean(player.image) && !/default\.avif$/i.test(player.image);

function CollegeCommits() {
  const currentUser = useContext(CurrentUserContext);
  const token = localStorage.getItem("jwt");
  const canManageLogos = ["admin", "coach"].includes(currentUser?.role);

  // Commitments families and coaches record on a player's profile show up here
  // too. The older hand-entered list below still appears; when the same player
  // is in both, the profile's version wins.
  const { data: profilePlayers = [] } = useQuery({
    queryKey: queryKeys.committedPlayers(),
    queryFn: getCommittedPlayers,
    staleTime: 60 * 1000,
  });

  const committedPlayers = useMemo(() => {
    const legacy = playersData.flatMap((team) =>
      team.players.filter((player) => player.isCommitted)
    );
    const merged = new Map(legacy.map((player) => [nameKey(player.name), player]));
    profilePlayers.forEach((player) => {
      const key = nameKey(player.name);
      merged.set(key, { ...merged.get(key), ...player });
    });
    return [...merged.values()];
  }, [profilePlayers]);

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
              {hasPhoto(player) ? (
                <img
                  src={resolveImageUrl(player.image)}
                  alt={player.name}
                  className="commit__image"
                  style={player.imagePosition ? { objectPosition: player.imagePosition } : undefined}
                />
              ) : (
                <div className="commit__image commit__image--placeholder" role="img" aria-label={player.name}>
                  {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <h3 className="commit__name">{player.name}</h3>
              <p className="commit__details">
                #{player.jersey} | {player.position} | Class of {player.gradYear}
              </p>
              <p className="commit__college">
                🎓 Committed To: <span>{player.committedCollege || "TBA"}</span>
              </p>
              <div className="commit__logo">
                <CollegeLogo college={player.committedCollege} className="college-logo--large" />
                {canManageLogos && player.committedCollege && (
                  <CollegeLogoUpload college={player.committedCollege} token={token} canReplace />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CollegeCommits;
