const buildWeatherUrl = (lat, lon, apiKey) =>
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;

const getWeatherByCoords = async (lat, lon, apiKey) => {
  const response = await fetch(buildWeatherUrl(lat, lon, apiKey));
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }
  return response.json();
};

const getWeatherForDefault = (apiKey) =>
  getWeatherByCoords(40.9, -74.2, apiKey);

export { getWeatherByCoords, getWeatherForDefault };
