const revealSections = document.querySelectorAll(
  ".content-section, .work-section, .contact-section"
);
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);
const weatherReading = document.querySelector("#weather-reading");
const weatherTitle = document.querySelector("#weather-title");

const weatherDescriptions = new Map([
  [0, "Clear"],
  [1, "Mostly clear"],
  [2, "Partly cloudy"],
  [3, "Overcast"],
  [45, "Foggy"],
  [48, "Foggy"],
  [51, "Light drizzle"],
  [53, "Drizzle"],
  [55, "Heavy drizzle"],
  [56, "Freezing drizzle"],
  [57, "Freezing drizzle"],
  [61, "Light rain"],
  [63, "Rain"],
  [65, "Heavy rain"],
  [66, "Freezing rain"],
  [67, "Freezing rain"],
  [71, "Light snow"],
  [73, "Snow"],
  [75, "Heavy snow"],
  [77, "Snow grains"],
  [80, "Light rain showers"],
  [81, "Rain showers"],
  [82, "Heavy rain showers"],
  [85, "Snow showers"],
  [86, "Heavy snow showers"],
  [95, "Thunderstorms"],
  [96, "Thunderstorms with hail"],
  [99, "Thunderstorms with hail"],
]);

function describeWeather(code) {
  return weatherDescriptions.get(code) ?? "Conditions unavailable";
}

function suggestActivity(code, temperature) {
  if (code >= 95 || [56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
    return "staying inside with a creative project";
  }

  if ([45, 48, 51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return "checking on the plants between showers";
  }

  if (temperature < 50 || temperature >= 92) {
    return "making something in the studio";
  }

  if (code <= 2 && temperature >= 60 && temperature < 86) {
    return "taking the dog for a walk";
  }

  return "making something in the studio";
}

function getBrowserCoordinates() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser does not support location access."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(coords),
      reject,
      { enableHighAccuracy: false, maximumAge: 600000, timeout: 8000 }
    );
  });
}

async function getCityName(coords) {
  const endpoint = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  endpoint.search = new URLSearchParams({
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    localityLanguage: "en",
  });

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Reverse geocoding returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const city = data.city || data.locality;
    if (typeof city === "string" && city.trim()) {
      return city.trim();
    }

    throw new Error("Reverse geocoding did not return a city name");
  } catch (error) {
    console.error("Unable to find the city for the browser location.", error);
    return "Your location";
  }
}

function showWeatherMessage(message, className) {
  if (!weatherReading) return;

  weatherReading.replaceChildren();
  const status = document.createElement("p");
  status.className = className;
  status.setAttribute("role", "status");
  status.textContent = message;
  weatherReading.append(status);
}

async function loadWeather(coords, city) {
  if (!weatherReading || !weatherTitle) return;

  weatherTitle.textContent = city;
  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.search = new URLSearchParams({
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    current: "temperature_2m,weather_code",
    temperature_unit: "fahrenheit",
    timezone: "auto",
  });

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Open-Meteo returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const temperature = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (!Number.isFinite(temperature) || !Number.isInteger(code)) {
      throw new Error("Open-Meteo response did not contain valid current conditions");
    }

    const description = describeWeather(code);
    const suggestion = suggestActivity(code, temperature);
    weatherReading.replaceChildren();

    const summary = document.createElement("p");
    summary.className = "weather-summary";
    summary.textContent = `${Math.round(temperature)}°F · ${description}`;

    const context = document.createElement("p");
    context.className = "weather-context";
    const prompt = document.createElement("strong");
    prompt.textContent = "Perfect weather for...";
    context.append(prompt, ` ${suggestion}`);

    weatherReading.append(summary, context);
  } catch (error) {
    console.error(`Unable to load weather for ${city}.`, error);
    showWeatherMessage(
      "Current conditions are unavailable right now.",
      "weather-error"
    );
  }
}

async function initializeWeather() {
  if (!weatherReading || !weatherTitle) return;

  try {
    const coords = await getBrowserCoordinates();
    const city = await getCityName(coords);
    await loadWeather(coords, city);
  } catch (error) {
    if (error.code === 1) {
      showWeatherMessage(
        "Enable location to see your weather.",
        "weather-permission"
      );
      return;
    }

    console.error("Unable to get the browser location.", error);
    showWeatherMessage(
      "Location is unavailable right now.",
      "weather-error"
    );
  }
}

if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
  const sectionObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  revealSections.forEach((section) => {
    section.classList.add("reveal-section");
    sectionObserver.observe(section);
  });
}

initializeWeather();
