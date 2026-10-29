const revealSections = document.querySelectorAll(
  ".content-section, .work-section, .contact-section"
);
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);
const weatherReading = document.querySelector("#weather-reading");

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

async function loadHoustonWeather() {
  if (!weatherReading) return;

  const endpoint = new URL("https://api.open-meteo.com/v1/forecast");
  endpoint.search = new URLSearchParams({
    latitude: "29.7604",
    longitude: "-95.3698",
    current: "temperature_2m,weather_code",
    temperature_unit: "fahrenheit",
    timezone: "America/Chicago",
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
    console.error("Unable to load Houston weather.", error);
    weatherReading.replaceChildren();

    const message = document.createElement("p");
    message.className = "weather-error";
    message.setAttribute("role", "status");
    message.textContent = "Current conditions are unavailable right now.";
    weatherReading.append(message);
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

loadHoustonWeather();
