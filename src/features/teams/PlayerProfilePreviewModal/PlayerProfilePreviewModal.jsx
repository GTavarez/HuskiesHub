import { resolveImageUrl } from "../../../utils/media.js";
import "./PlayerProfilePreviewModal.css";

function PlayerProfilePreviewModal({ onClose, player, openLogin }) {
  return (
    <div className="modal__overlay">
      <div className="modal__container">
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
        ></button>
        <header className="modal__header">
          {resolveImageUrl(player.image) ? (
            <img
              src={resolveImageUrl(player.image)}
              alt={player.name}
              className="modal__player-img"
            />
          ) : (
            <div className="modal__player-img modal__player-img--placeholder">
              {player.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <h2>{player.name}</h2>
          <p className="modal__player-info">
            #{player.jersey} • {player.position} • GPA:{player.GPA}
          </p>
        </header>
        <p className="modal__warning">Sign in to view full player profile</p>
        <button className="modal__login-btn" type="button" onClick={openLogin}>
          Log in to view more
        </button>
      </div>
    </div>
  );
}

export default PlayerProfilePreviewModal;
