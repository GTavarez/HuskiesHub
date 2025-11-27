import { useParams, Link } from "react-router-dom";
import { playersData } from "../../utils/constants";
import "./PlayerProfileModal.css";

function PlayerProfileModal({ onClose, player }) {
  /* const { id } = useParams();
  const playerId = parseInt(id);
   const player = playersData
    .flatMap((team) => team.players)
    .find((p) => p._id === playerId); */

  if (!player) {
    return (
      <div className="player__profile__notfound">
        <h2>Player not found</h2>
        <Link to="/teams" className="player__profile_back-btn">
          ← Back to Teams
        </Link>
      </div>
    );
  }

  return (
    <div className="profile__overlay" onClick={onClose}>
      <div className="profilePlayer__container" onClick={(e) => e.stopPropagation()}>
        <button className="profile__modal__close" onClick={onClose}>
          ✕
        </button>

        {/* HERO SECTION */}
        <div className="profile__hero">
          <img
            src={player.image}
            alt={player.name}
            className="profile__hero_img"
          />

          <div className="profile__info">
            <h1>{player.name}</h1>
            <h3>
              #{player.jersey} • {player.position}
            </h3>
            <p>
              {player.highSchool} — Class of {player.gradYear}
            </p>

            {player.isCommitted && (
              <p className="profile__commit">
                🎓 Committed to {player.committedCollege}
              </p>
            )}
          </div>
        </div>

        {/* BIO */}
        <div className="profile__section">
          <h2>About {player.name}</h2>
          <p>
            {player.name} is a dedicated {player.position.toLowerCase()} from{" "}
            {player.highSchool}. Known for their strong work ethic and
            leadership, {player.name.split(" ")[0]} represents the Empire State
            Huskies with pride and passion.
          </p>
        </div>

        {/* FUN FACTS */}
        <div className="profile__section">
          <h2>Fun Facts</h2>
          <ul className="profile__funfacts">
            <li>
              <strong>Favorite Player:</strong> Jennie Finch
            </li>
            <li>
              <strong>Pre-game Ritual:</strong> Listens to hype music
            </li>
            <li>
              <strong>Favorite Moment:</strong> Winning the state semifinals
            </li>
          </ul>
        </div>

        {/* HIGHLIGHTS */}
        {/* <div className="profile__section">
          <h2>Highlights</h2>
          <div className="highlights__grid">
            <img src="/assets/highlights/highlight1.jpg" alt="" />
            <img src="/assets/highlights/highlight2.jpg" alt="" />
            <img src="/assets/highlights/highlight3.jpg" alt="" />
          </div>
        </div> */}

        <div className="profile__footer">
          <button className="profile__return-btn" onClick={onClose}>
            ← Back to Players
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerProfileModal;
