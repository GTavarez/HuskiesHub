// src/components/WeatherBanner/WeatherBanner.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getWeatherByCoords, getWeatherForDefault } from "../../api/weather";
import { queryKeys } from "../../api/queryKeys";
import "./WeatherBanner.css";

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error)
    );
  });

function WeatherBanner() {
  const {
    data: weather,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.weather("geo", "geo"),
    enabled: Boolean(apiKey),
    queryFn: async () => {
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        return getWeatherByCoords(latitude, longitude, apiKey);
      } catch {
        return getWeatherForDefault(apiKey);
      }
    },
  });

  if (!apiKey || isLoading || !weather || isError) return null;

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
