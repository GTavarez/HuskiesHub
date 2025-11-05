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
          ← Back to Players
        </Link>
      </div>
    );
  }

  return (
    <div className="profile__overlay">
      <div className="profile">
        <button className="modal__close" onClick={onClose}></button>
        <div className="profile__hero">
          <img
            src={player.image}
            alt={player.name}
            className="profile__hero_img"
          />

          <div className="profile__info">
            <h1>{player.name}</h1>
            <h3>
              #{player.jersey} | {player.position}
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

        {/* 🧍 Bio Section */}
        <div className="profile__bio">
          <h2>About {player.name}</h2>
          <p>
            {player.name} is a dedicated {player.position.toLowerCase()} from{" "}
            {player.highSchool}, graduating in {player.gradYear}. Known for
            their strong work ethic and leadership,
            {player.name.split(" ")[0]} represents the Empire State Huskies with
            pride and passion.
          </p>
        </div>

        {/* ✨ Fun Facts Section */}
        {/*  <div className="profile__funfacts">
        <h2>Fun Facts</h2>
        <ul>
          <li><strong>Favorite Player:</strong> Jennie Finch</li>
          <li><strong>Pre-game Ritual:</strong> Listens to hype music</li>
          <li><strong>Favorite Moment:</strong> Winning the state semifinals</li>
        </ul>
      </div> */}

        {/* 📸 Highlights Section */}
        {/*  <div className="profile__highlights">
        <h2>Highlights</h2>
        <div className="highlights__grid">
          <img src="/assets/highlights/highlight1.jpg" alt="Highlight 1" />
          <img src="/assets/highlights/highlight2.jpg" alt="Highlight 2" />
          <img src="/assets/highlights/highlight3.jpg" alt="Highlight 3" />
        </div>
      </div> */}

        {/* 🔗 Contact/Social Section (optional) */}
        {/* <div className="profile__social">
        <h2>Connect</h2>
        <div className="social__links">
          <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a>
        </div>
      </div> */}

        <div className="profile__footer">
          <Link to="/teams" className="profile__return-btn">
            ← Back to Players
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PlayerProfileModal;
