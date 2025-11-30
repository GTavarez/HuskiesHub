import "./Players.css";
import { playersData } from "../../utils/constants";
import { useParams, useNavigate } from "react-router-dom";
import PlayerProfileModal from "../PlayerProfile/PlayerProfileModal";
import PlayerProfilePreviewModal from "../PlayerProfilePreviewModal/PlayerProfilePreviewModal";

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
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/teams");
  };
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
                  <img src={cleanImage(player.image)} alt={player.name} />
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
                      onViewProfile(player); // open preview modal with the selected player
                      /* openLogin(); */ // show login modal
                      return;
                    }
                    onViewProfile(player); // open full profile modal
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
            player={selectedPlayer}
            openLogin={openLogin}
            onClose={onClose}
          />
        ))}
    </section>
  );
}

export default Players;
