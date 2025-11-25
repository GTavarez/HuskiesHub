import React, { useState, useEffect } from "react";
import "./HomeBanner.css";

const images = [
"../../assets/banner1.jpg",
"../../assets/banner2.jpg",
"../../assets/banner3.jpg",
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
