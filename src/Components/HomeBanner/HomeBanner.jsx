import React, { useState, useEffect } from "react";
import "./HomeBanner.css";

const BACKEND_BASE =
  "https://api.eshuskiesyoffee.com";

const images = [
  `${BACKEND_BASE}/images/banner1.jpg`,
  `${BACKEND_BASE}/images/banner2.jpg`,
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

        <div className="bannerContent">
          <h1 className="bannerTitle">Empire State Huskies</h1>
          <p className="bannerSubtitle">Softball • Training • Excellence</p>
        </div>

        <div className="bannerDots">
          {images.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === current ? "active" : ""}`}
              onClick={() => setCurrent(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomeBanner;
