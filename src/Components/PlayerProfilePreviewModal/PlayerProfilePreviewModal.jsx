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
          <img
            src={player.image}
            alt={player.name}
            className="modal__player-img"
          />
          {/*  <img
            src="https://s.yimg.com/fz/api/res/1.2/MY7F1QqCpjlLsL71bBnbRg--~C/YXBwaWQ9c3JjaGRkO2ZpPWZpbGw7aD00MTI7cHhvZmY9NTA7cHlvZmY9MTAwO3E9ODA7c3M9MTt3PTM4OA--/https://i.pinimg.com/736x/76/68/4a/76684ac1fccf120998c15dcc094a07ad.jpg"
            alt={player.name}
            className="modal__player-img"
          /> */}
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
