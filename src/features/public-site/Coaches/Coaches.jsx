import "./Coaches.css";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getCoaches } from "../../../api/users.js";
import { queryKeys } from "../../../api/queryKeys.js";
import CoachCard from "../CoachCard/CoachCard.jsx";

function Coaches() {
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: queryKeys.coaches(),
    queryFn: getCoaches,
  });

  return (
    <section className="coaches">
      <div className="coaches__header">
        <h2 className="coaches__title">Coaching Staff</h2>
        <p className="coaches__subtitle">
          The Empire State Huskies are led by a staff dedicated to player
          development, character, and preparing athletes for the next level.
        </p>
      </div>

      {isLoading && <p style={{ textAlign: "center" }}>Loading coaches...</p>}

      <div className="coaches__grid">
        {coaches.map((coach) => (
          <CoachCard key={coach._id} coach={coach} />
        ))}
      </div>
    </section>
  );
}

export default Coaches;
