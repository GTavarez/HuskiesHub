// src/utils/loadGoogleMaps.js
export default function loadGoogleMaps(apiKey, callback) {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  const existingScript = document.querySelector(
    `script[src*="maps.googleapis.com"]`
  );
  if (existingScript) {
    existingScript.addEventListener("load", callback);
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.body.appendChild(script);
}
