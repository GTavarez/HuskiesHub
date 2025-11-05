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

  // ✅ Make sure the key name matches your data file
  const team = playersData.find((t) => t._id === parseInt(teamsId));

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/teams");
  };

  return (
    <section className="players__section">
      <header className="players__header">
        <button className="players__back-btn" onClick={handleBack}>
          {" "}
          ← Back to Teams
        </button>
        <h2>{team ? `${team.name} ${team.ageGroup}` : "Teams"}</h2>
        <div className="players__divider"></div>
      </header>

      {/* ✅ Only show players from the selected team */}
      {team ? (
        <div key={team._id} className="players__team__block">
          {/* <h3 className="players__team__name">{`${team.name} ${team.ageGroup}`}</h3> */}
          <div className="players__team__grid">
            {team.players.map((player) => (
              <div key={player._id} className="player__card">
                <div className="player__image">
                  <img src={player.image} alt={player.name} />
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
                  onClick={() => onViewProfile(player)}
                  className="player__profile-btn"
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
