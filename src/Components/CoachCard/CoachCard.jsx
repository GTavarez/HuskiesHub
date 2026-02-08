// src/Components/Coaches/CoachCard.jsx
import React from "react";

function CoachCard({ coach, cleanImage }) {
  return (
    <article className="coach-card">
      <div className="coach-card__image-wrapper">
        {coach.image ? (
          <img
            src={cleanImage(coach.image)}
            alt={coach.name}
            className="coach-card__image"
          />
        ) : (
          <div className="coach-card__image coach-card__image--placeholder">
            {coach.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="coach-card__content">
        <h3 className="coach-card__name">{coach.name}</h3>
        <p className="coach-card__role">{coach.role}</p>
        <p className="coach-card__bio">{coach.bio}</p>

        <div className="coach-card__contact">
          {coach.email && (
            <a href={`mailto:${coach.email}`} className="coach-card__link">
              ✉ {coach.email}
            </a>
          )}
          {coach.phone && (
            <a href={`tel:${coach.phone}`} className="coach-card__link">
              ☎ {coach.phone}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default CoachCard;
