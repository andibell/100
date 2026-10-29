# Andi Bell — Personal Website

A lightweight, responsive personal website for Andi Bell, product and experience strategist.

## Project structure

- `index.html` — semantic page content and structure
- `styles.css` — visual system and responsive styling
- `app.js` — section reveals and location-based weather
- `assets/images/andi-bell-with-dog.jpg` — hero portrait
- `BRIEF.md` — project source of truth

## Run locally

No build step or package installation is required. Open the project in VS Code and use Live Server to preview `index.html`.

Live Server is recommended because browsers require a secure context for geolocation. Allow location access to see weather for the browser’s location; if access is denied or unavailable, the weather component displays an explanatory message.

## Weather and location

The site requests the visitor’s browser location, then:

1. Uses the BigDataCloud reverse-geocoding endpoint to look up a city name.
2. Uses Open-Meteo to retrieve the current temperature and weather condition.

Neither service requires an API key for these requests. The browser coordinates are sent to both services. If city lookup fails, the weather heading falls back to “Your location”; if geolocation is denied, weather is not requested.

## Accessibility

The site uses semantic HTML, keyboard-visible focus states, reduced-motion support, descriptive image text, and live status announcements for weather loading and errors.
