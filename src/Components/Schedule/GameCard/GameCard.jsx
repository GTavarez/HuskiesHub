import React, { useState } from "react";
import GameMapModal from "../GameMapModal/GameMapModal.jsx";
import "./GameCard.css";

function GameCard({ event, onClose }) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <div className="modal__overlay">
      <div className="modal__content">
        <button className="modal__close" onClick={onClose}>
          ×
        </button>
        <h2>{event.title}</h2>
        <p>
          <strong>Date:</strong> {new Date(event.start).toLocaleString()}
        </p>
        <p>
          <strong>Location:</strong>{" "}
          <span
            className="modal__location-link"
            onClick={() => setIsMapOpen(true)}
          >
            {event.extendedProps?.location || "TBA"}
          </span>
        </p>

        {isMapOpen && (
          <GameMapModal
            address={event.extendedProps.location}
            onClose={() => setIsMapOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default GameCard;
