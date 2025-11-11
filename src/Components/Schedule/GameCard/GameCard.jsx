
import React, { useEffect, useRef } from "react";
import "./GameCard.css";
import loadGoogleMaps from "../../../utils/loadGoogleMaps";

function GameCard({ game, onClose }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !game?.location) return;

    loadGoogleMaps(apiKey, () => {
      const geocoder = new window.google.maps.Geocoder();
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: { lat: 40.7, lng: -74.0 },
        disableDefaultUI: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0a192f" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
          {
            elementType: "labels.text.stroke",
            stylers: [{ color: "#0a192f" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#112240" }],
          },
          { featureType: "water", stylers: [{ color: "#1a365d" }] },
        ],
      });

      geocoder.geocode({ address: game.location }, (results, status) => {
        if (status === "OK" && results[0]) {
          const position = results[0].geometry.location;
          map.setCenter(position);

          const marker = new window.google.maps.Marker({
            map,
            position,
            title: game.title,
          });

          const openDirections = () => {
            const encoded = encodeURIComponent(game.location);
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${encoded}`,
              "_blank"
            );
          };

          marker.addListener("click", openDirections);
          map.addListener("click", openDirections);
        }
      });

      // 🔧 Important: trigger resize once modal is fully shown
      setTimeout(() => {
        window.google.maps.event.trigger(map, "resize");
      }, 300);
    });
  }, [game]);
  return (
    <div
      className="game__modal__overlay"
      onClick={(e) => {
        if (e.target.classList.contains("game__modal__overlay")) onClose();
      }}
    >
      <div
        className="game__modal__container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose}>
          ✕
        </button>

        <h2 className="game__modal__title">{game.title}</h2>
        <p className="game__modal__date">
          📅 {new Date(game.start).toLocaleString()}{" "}
          {game.end && `– ${new Date(game.end).toLocaleTimeString()}`}
        </p>
        <p className="game__modal__location">📍 {game.location}</p>

        <div className="game__map__wrapper">
          <div className="game__map__container" ref={mapRef}></div>
        </div>
      </div>
    </div>
  );
}

export default GameCard;
