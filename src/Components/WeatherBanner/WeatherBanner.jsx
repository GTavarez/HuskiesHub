// src/components/WeatherBanner/WeatherBanner.jsx
import React, { useEffect, useState } from "react";
import "./WeatherBanner.css";

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

function WeatherBanner() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!apiKey) {
      console.error("❌ Missing OpenWeather API key.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${apiKey}`
          );
          const data = await response.json();
          setWeather(data);
        } catch (err) {
          console.error("Weather fetch error:", err);
        }

        setLoading(false);
      },
      () => {
        console.warn("⚠️ Location blocked, using default NJ");
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=40.9&lon=-74.2&units=imperial&appid=${apiKey}`
        )
          .then((res) => res.json())
          .then((data) => setWeather(data))
          .finally(() => setLoading(false));
      }
    );
  }, []);

  if (loading || !weather) return null;

  const condition = weather.weather[0].main;
  const temp = Math.round(weather.main.temp);

  // Dynamic alert message
  let alertMessage = "";
  if (
    condition === "Rain" ||
    condition === "Thunderstorm" ||
    condition === "Drizzle"
  ) {
    alertMessage = "Rain expected — check schedule updates!";
  } else if (condition === "Snow") {
    alertMessage = "Snow in the area — drive safely!";
  } else if (temp > 90) {
    alertMessage = "High heat alert — stay hydrated!";
  } else if (temp < 32) {
    alertMessage = "Freezing conditions — dress warm!";
  } else {
    alertMessage = `Weather looks good — ${condition}`;
  }

  return (
    <div className="weatherBanner">
      <span className="weatherBanner__temp">{temp}°F</span>
      <span className="weatherBanner__condition">{condition}</span>
      <span className="weatherBanner__alert">{alertMessage}</span>
    </div>
  );
}

export default WeatherBanner;
