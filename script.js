// ---------- Settings ----------
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const ICON_URL = "https://openweathermap.org/img/wn/";

// ---------- Grab the elements we need ----------
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

const locationEl = document.getElementById("location");
const iconEl = document.getElementById("icon");
const tempEl = document.getElementById("temp");
const conditionEl = document.getElementById("condition");
const feelsEl = document.getElementById("feels");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const unitBtn = document.getElementById("unit-btn");

// ---------- State ----------
let currentData = null; // the last weather data we received
let useCelsius = true;

// ---------- Helpers ----------
function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

// The API gives Celsius (we ask for units=metric). Convert when needed.
function formatTemp(celsius) {
  const value = useCelsius ? celsius : (celsius * 9) / 5 + 32;
  return `${Math.round(value)}°${useCelsius ? "C" : "F"}`;
}

// ---------- Talk to the API ----------
async function getWeather(city) {
  if (typeof API_KEY === "undefined" || API_KEY.startsWith("PASTE_")) {
    throw new Error("NO_KEY");
  }

  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
  const response = await fetch(url); // send the request

  if (response.status === 404) throw new Error("NOT_FOUND");
  if (response.status === 401) throw new Error("BAD_KEY");
  if (response.status === 429) throw new Error("TOO_MANY");
  if (!response.ok) throw new Error("SERVER");

  return response.json(); // turn the JSON text into a JavaScript object
}

const ERROR_MESSAGES = {
  NO_KEY: "Add your OpenWeatherMap API key in config.js first.",
  NOT_FOUND: "City not found. Check the spelling, add the country code (e.g. Razole,IN) or try a nearby larger town.",
  BAD_KEY: "API key not accepted. New keys can take up to a couple of hours to activate.",
  TOO_MANY: "Too many requests. Please wait a minute and try again.",
  SERVER: "The weather service had a problem. Please try again later.",
};

// ---------- Show the data on the page ----------
function renderWeather() {
  const data = currentData;
  if (!data) return;

  const weather = data.weather[0]; // first item of the "weather" array

  locationEl.textContent = `${data.name}, ${data.sys.country}`;
  tempEl.textContent = formatTemp(data.main.temp);
  feelsEl.textContent = formatTemp(data.main.feels_like);
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // m/s to km/h
  conditionEl.textContent = weather.description;

  iconEl.src = `${ICON_URL}${weather.icon}@2x.png`;
  iconEl.alt = weather.main;

  resultEl.hidden = false;
}

// ---------- Search flow ----------
async function searchCity(city) {
  showStatus("Loading weather...");
  searchBtn.disabled = true;

  try {
    currentData = await getWeather(city);
    renderWeather();
    showStatus("");

    try {
      localStorage.setItem("lastCity", currentData.name); // remember for next visit
    } catch (e) {
      /* storage can be blocked, ignore */
    }
  } catch (error) {
    resultEl.hidden = true;
    const message = ERROR_MESSAGES[error.message];
    showStatus(message || "No internet connection. Check your network and try again.", true);
  } finally {
    searchBtn.disabled = false;
  }
}

// ---------- Events ----------
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading
  const city = cityInput.value.trim();
  if (city) searchCity(city);
});

unitBtn.addEventListener("click", () => {
  useCelsius = !useCelsius;
  unitBtn.textContent = useCelsius ? "Switch to °F" : "Switch to °C";
  renderWeather();
});

// ---------- On page load: show the last searched city ----------
try {
  const saved = localStorage.getItem("lastCity");
  if (saved) {
    cityInput.value = saved;
    searchCity(saved);
  }
} catch (e) {
  /* storage can be blocked, ignore */
}
