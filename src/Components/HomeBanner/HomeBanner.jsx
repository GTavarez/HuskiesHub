import React, { useState, useEffect } from "react";
import "./HomeBanner.css";

const images = [
  "https://images.unsplash.com/photo-1517649763962-0c623066013b",
  "https://images.unsplash.com/photo-1587280501635-68a0e86f0d31",
  "https://images.unsplash.com/photo-1581011401790-1c1ffc33d5c1",
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
