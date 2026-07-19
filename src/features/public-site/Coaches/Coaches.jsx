import "./Coaches.css";
import React from "react";
import { coachesData } from "../../../utils/constants.js";
import CoachCard from "../CoachCard/CoachCard.jsx";
import { resolveImageUrl } from "../../../utils/media.js";

function Coaches() {
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
          <CoachCard
            key={coach.id}
            coach={coach}
            cleanImage={(image) => resolveImageUrl(image, "images")}
          />
        ))}
      </div>
    </section>
  );
}

export default Coaches;
