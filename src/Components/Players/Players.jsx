import "./Players.css";
import { playersData } from "../../utils/constants";
import { useParams, useNavigate } from "react-router-dom";
import PlayerProfileModal from "../PlayerProfile/PlayerProfileModal";
import PlayerProfilePreviewModal from "../PlayerProfilePreviewModal/PlayerProfilePreviewModal";

const playerImages = import.meta.glob(
  "/src/assets/players/*.{jpg,jpeg,png,avif}",
  {
    eager: true,
  }
);

function Players({
  onViewProfile,
  onClose,
  selectedPlayer,
  isLoggedIn,
  isProfileModalOpen,
  openLogin,
}) {
  const { teamsId } = useParams();

  const team = playersData.find((t) => t._id === parseInt(teamsId));

  // ✅ CORRECT GLOB
  /*  const playerImages = import.meta.glob(
    "/src/assets/players/*.{jpg,jpeg,png,webp,avif}",
    { eager: true }
  ); */

  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/teams");
  };

  // ✅ FIXED IMAGE LOOKUP
  function getPlayerImage(filename) {
    if (!filename) {
      return "/default.avif";
    }

    const lower = filename.toLowerCase();

    for (const [path, module] of Object.entries(playerImages)) {
      if (path.toLowerCase().includes(lower)) {
        return module.default; // <-- always returns a string URL
      }
    }

    return "/default.avif";
  }

  return (
    <section className="players__section">
      <header className="players__header">
        <button className="players__back-btn" onClick={handleBack}>
          ← Back to Teams
        </button>
        <h2>{team ? `${team.name} ${team.ageGroup}` : "Teams"}</h2>
        <div className="players__divider"></div>
      </header>

      {team ? (
        <div key={team._id} className="players__team__block">
          <div className="players__team__grid">
            {team.players.map((player) => (
              <div key={player._id} className="player__card">
                <div className="player__image">
                  <img src={getPlayerImage(player.image)} alt={player.name} />
                </div>

                <h4>{player.name}</h4>
                <p className="player__info">
                  <span>#{player.jersey}</span> | {player.position}
                </p>

                <p className="player__details">
                  Grad Year: {player.gradYear}
                  <br />
                  {player.highSchool}
                </p>

                <button
                  type="button"
                  className="player__profile-btn"
                  onClick={() => {
                    if (!isLoggedIn) {
                      openLogin();
                      onClose();
                    } else {
                      onViewProfile(player);
                    }
                  }}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#ccc" }}>
          Team not found or no team selected.
        </p>
      )}

      {selectedPlayer &&
        isProfileModalOpen &&
        (isLoggedIn ? (
          <PlayerProfileModal player={selectedPlayer} onClose={onClose} />
        ) : (
          <PlayerProfilePreviewModal
            openLogin={openLogin}
            player={selectedPlayer}
            onClose={onClose}
          />
        ))}
    </section>
  );
}

export default Players;
