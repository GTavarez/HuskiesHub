import React, { useEffect, useRef, useState } from "react";
import "./GameCard.css";

function GameCard({ game, onClose }) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const modalContentRef = useRef(null);
  const [modalContentHeight, setModalContentHeight] = useState(551);

  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    game.location
  )}&output=embed`;

  //  Get directions when the button is clicked
  const handleGetDirections = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = encodeURIComponent(game.location);
          window.open(
            `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`,
            "_blank"
          );
        },
        () => {
          // fallback if user denies geolocation
          const destination = encodeURIComponent(game.location);
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
            "_blank"
          );
        }
      );
    } else {
      // no geolocation support
      const destination = encodeURIComponent(game.location);
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        "_blank"
      );
    }
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
