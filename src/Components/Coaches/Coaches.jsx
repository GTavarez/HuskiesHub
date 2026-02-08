import "./Coaches.css";
import React from "react";
import { coachesData } from "../../utils/constants.js";
import CoachCard from "../CoachCard/CoachCard.jsx";

function Coaches() {
  const cleanImage = (str) => {
    if (!str) return "default";

    const withoutExt = str.replace(".jpg", "");

    if (withoutExt.startsWith("http")) return withoutExt + ".jpg";

    return `https://api.eshuskiesyoffee.com/${withoutExt}.jpg`;
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
          <CoachCard key={coach.id} coach={coach} cleanImage={cleanImage} />
        ))}
      </div>
    </section>
  );
}

export default Coaches;
