import "./Coaches.css";
import React from "react";
import "./Coaches.css";
import { coachesData } from "../../utils/constants.js";

function Coaches() {
  const cleanImage = (str) => {
    if (!str) return "default";

    // remove .jpg anywhere
    const withoutExt = str.replace(".jpg", "");

    // if already full URL:
    if (withoutExt.startsWith("http")) return withoutExt + ".jpg";

    // otherwise add backend
    return `https://huskieshub-backend-891073803869-us-central1.run.app/images/${withoutExt}.jpg`;
  };
  return (
    <section className="coaches">
      <div className="coaches__header">
        <h2 className="coaches__title">Coaching Staff</h2>
        <p className="coaches__subtitle">
          The Empire State Huskies are led by a staff dedicated to player
          development, character, and preparing athletes for the next level.
        </p>
      </div>

      <div className="coaches__grid">
        {coachesData.map((coach) => (
          <article key={coach.id} className="coach-card">
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
                  <a
                    href={`mailto:${coach.email}`}
                    className="coach-card__link"
                  >
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
        ))}
      </div>
    </section>
  );
}

export default Coaches;
