import React, { useState, useEffect } from "react";
import "./HomeBanner.css";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8080"
    : "https://huskieshub-backend-891073803869.us-central1.run.app";

const images = [
  `${BASE_URL}/api/uploads/692e1702f9271d773ed7d7c5`,
  `${BASE_URL}/api/uploads/692e1a9c83b8ca375da343fb`,
];


function HomeBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="homeBanner__wrapper">
      <div className="homeBanner">
        {images.map((img, index) => (
          <div
            key={index}
            className={`bannerSlide ${index === current ? "active" : ""}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}

        {/* Optional overlay text */}
        <div className="bannerContent">
          <h1 className="bannerTitle">Empire State Huskies</h1>
          <p className="bannerSubtitle">Softball • Training • Excellence</p>
        </div>

        {/* Navigation dots */}
        <div className="bannerDots">
          {images.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === current ? "active" : ""}`}
              onClick={() => setCurrent(index)}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeBanner;
