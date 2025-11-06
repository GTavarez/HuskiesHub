import React from "react";
import "./GameMapModal.css";

function GameMapModal({ address, onClose }) {
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    address
  )}&output=embed`;

  return (
    <div className="modal__overlay">
      <div className="modal__content map-modal">
        <button className="modal__close" onClick={onClose}>
          ×
        </button>
        <h3>Field Location</h3>
        <iframe
          src={mapUrl}
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}

export default GameMapModal;
