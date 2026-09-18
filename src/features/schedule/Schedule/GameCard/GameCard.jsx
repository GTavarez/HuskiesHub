import React, { useEffect, useRef, useState } from "react";
import "./GameCard.css";

function GameCard({ game, onClose }) {
  const [, setIsMapOpen] = useState(false);
  const modalContentRef = useRef(null);
  const [modalContentHeight, setModalContentHeight] = useState(551);

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    game.location
  )}&output=embed`;

  // window.open must run synchronously inside the click handler — browsers
  // only allow a popup as a direct response to a user gesture. Waiting on
  // navigator.geolocation.getCurrentPosition() first (which is async) broke
  // that chain, so the browser silently blocked the popup with no visible
  // error. Omitting "origin" isn't a loss either — Google Maps already uses
  // the device's current location as the starting point automatically.
  const handleGetDirections = () => {
    const destination = encodeURIComponent(game.location);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, "_blank");
  };

  function handleResize() {
    setModalContentHeight(modalContentRef.current?.offsetHeight);
  }
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (modalContentRef.current) {
      handleResize();
    }
  }, []);

  return (
    <div className="modal__overlay">
      <div ref={modalContentRef} className="modal__content-game">
        <button className="modal__close" onClick={onClose}></button>

        <h2 className="modal__title">{game.title}</h2>

        <p>
          <strong>Date:</strong> {new Date(game.start).toLocaleString()}
        </p>

        <p>
          <strong>Location:</strong>{" "}
          <button
            type="button"
            className="modal__location-link"
            onClick={() => setIsMapOpen(true)}
          >
            {game.location || "TBA"}
          </button>
        </p>

        <iframe
          src={mapUrl}
          width="100%"
          style={{ border: 0, height: `${modalContentHeight - 270}px` }}
          allowFullScreen=""
          loading="lazy"
        ></iframe>

        <button className="directions__btn" onClick={handleGetDirections}>
          🚗 Get Directions
        </button>
      </div>
    </div>
  );
}

export default GameCard;
