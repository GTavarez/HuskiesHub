// src/Components/Coaches/CoachCard.jsx
import React from "react";
import { resolveMediaUrl } from "../../../utils/media.js";

function CoachCard({ coach }) {
  const photoUrl = resolveMediaUrl(coach.avatar);
  const title = coach.coachTitle || (coach.role === "admin" ? "Head Coach / Director" : "Coach");

  return (
    <article className="coach-card">
      <div className="coach-card__image-wrapper">
        {photoUrl ? (
          <img src={photoUrl} alt={coach.name} className="coach-card__image" />
        ) : (
          <div className="coach-card__image coach-card__image--placeholder">
            {coach.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="coach-card__content">
        <h3 className="coach-card__name">{coach.name}</h3>
        <p className="coach-card__role">
          {title}
          {coach.teamId?.name ? ` — ${coach.teamId.name}` : ""}
        </p>
        {coach.bio ? (
          <p className="coach-card__bio">{coach.bio}</p>
        ) : (
          <p className="coach-card__bio coach-card__bio--empty">Bio coming soon.</p>
        )}

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
