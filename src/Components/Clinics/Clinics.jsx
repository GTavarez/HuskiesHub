import React from "react";
import "./Clinics.css";
import { clinicsData } from "../../utils/constants.js";

function Clinics() {
  return (
    <section className="clinics">
      <div className="clinics__header">
        <h2 className="clinics__title">Clinics & Camps</h2>
        <p className="clinics__subtitle">
          Huskies clinics are designed to sharpen skills, build softball IQ, and
          give athletes a feel for the Empire State Huskies culture.
        </p>
      </div>

      <div className="clinics__grid">
        {clinicsData.map((clinic) => (
          <article key={clinic.id} className="clinic-card">
            <h3 className="clinic-card__title">{clinic.title}</h3>
            <p className="clinic-card__meta">
              <span>📅 {clinic.date}</span>
              <span>⏰ {clinic.time}</span>
            </p>
            <p className="clinic-card__location">📍 {clinic.location}</p>
            <p className="clinic-card__level">Level: {clinic.level}</p>
            <p className="clinic-card__description">{clinic.description}</p>

            <div className="clinic-card__footer">
              <span className="clinic-card__price">{clinic.price}</span>
              <a
                href={clinic.registerLink}
                className="clinic-card__register-btn"
              >
                Register
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Clinics;
