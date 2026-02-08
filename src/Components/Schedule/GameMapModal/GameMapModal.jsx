import "./GameMapModal.css";

function GameMapModal({ onClose }) {
  return (
    <div className="modal__overlay">
      <div className="modal__content map-modal">
        <button className="modal__close" onClick={onClose}>
          ×
        </button>
        <h3>Field Location</h3>
      </div>
    </div>
  );
}

export default GameMapModal;
