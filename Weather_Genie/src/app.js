const API_KEY = "80b753dc29dfee5baefbcbcb01d019ee";

const ICON_MAP = {
    "Clear": "fa-sun",
    "Clouds": "fa-cloud",
    "Rain": "fa-cloud-rain",
    "Drizzle": "fa-cloud-rain",
    "Thunderstorm": "fa-bolt",
    "Snow": "fa-snowflake",
    "Mist": "fa-smog",
    "Smoke": "fa-smog",
    "Haze": "fa-smog",
    "Fog": "fa-smog"
};

// DOM Elements
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    weatherCard: document.getElementById('weatherCard'),
    cityName: document.getElementById('cityName'),
    date: document.getElementById('date'),
    weatherIcon: document.getElementById('weatherIcon'),
    temperature: document.getElementById('temperature'),
    weatherCondition: document.getElementById('weatherCondition'),
    humidity: document.getElementById('humidity'),
    wind: document.getElementById('wind'),
    pressure: document.getElementById('pressure'),
    errorMsg: document.getElementById('errorMsg'),
    toggleUnit: document.getElementById('toggleUnit'),
    saveFavorite: document.getElementById('saveFavorite'),
    getLocation: document.getElementById('getLocation'),
    favorites: document.getElementById('favorites')
};

// State
let currentData = null;
let isCelsius = true;
let favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];

// Initialize
updateDate();
renderFavorites();
loadLastCity();

// Event Listeners
elements.searchBtn.addEventListener('click', fetchWeather);
elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWeather();
});
elements.toggleUnit.addEventListener('click', toggleUnit);
elements.saveFavorite.addEventListener('click', saveFavorite);
elements.getLocation.addEventListener('click', getLocationByGeolocation);

// Functions
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elements.date.textContent = new Date().toLocaleDateString(undefined, options);
}

async function fetchWeather() {
    const city = elements.cityInput.value.trim();
    if (!city) {
        showError("Please enter a city name");
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch weather data");
        }

        currentData = await response.json();
        renderWeather(currentData);
        saveLastCity(city);
    } catch (err) {
        showError(err.message);
        console.error("API Error:", err);
    }
}

function renderWeather(data) {
    // Basic info
    elements.cityName.textContent = data.name;
    elements.weatherCondition.textContent = data.weather[0].description;
    elements.humidity.textContent = `${data.main.humidity}%`;
    elements.wind.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    elements.pressure.textContent = `${data.main.pressure} hPa`;

    // Temperature
    elements.temperature.textContent = Math.round(data.main.temp);
    isCelsius = true;
    elements.toggleUnit.textContent = "°C | °F";

    // Weather icon
    const weatherMain = data.weather[0].main;
    const iconClass = ICON_MAP[weatherMain] || "fa-cloud-sun";
    elements.weatherIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    elements.weatherIcon.style.color = getIconColor(weatherMain);

    // Show UI
    elements.weatherCard.classList.remove('hidden');
    elements.saveFavorite.classList.remove('hidden');
    elements.errorMsg.classList.add('hidden');

    // Check if already favorited
    const isFavorite = favorites.some(fav => fav.toLowerCase() === data.name.toLowerCase());
    elements.saveFavorite.innerHTML = isFavorite
        ? '<i class="fas fa-heart"></i> Saved'
        : '<i class="far fa-heart"></i> Save';
}

function getIconColor(weatherMain) {
    const colors = {
        "Clear": "#FFD700",
        "Clouds": "#A9A9A9",
        "Rain": "#1E90FF",
        "Snow": "#ADD8E6",
        "Thunderstorm": "#9400D3"
    };
    return colors[weatherMain] || "#6a11cb";
}

function toggleUnit() {
    if (!currentData) return;

    isCelsius = !isCelsius;
    const temp = currentData.main.temp;
    elements.temperature.textContent = isCelsius
        ? Math.round(temp)
        : Math.round((temp * 9 / 5) + 32);
    elements.toggleUnit.textContent = isCelsius ? "°C | °F" : "°F | °C";
}

function showError(message) {
    elements.errorMsg.textContent = message;
    elements.errorMsg.classList.remove('hidden');
    elements.weatherCard.classList.add('hidden');
}

function saveFavorite() {
    if (!currentData) return;

    const city = currentData.name;
    const index = favorites.findIndex(fav => fav.toLowerCase() === city.toLowerCase());

    if (index === -1) {
        favorites.push(city);
        elements.saveFavorite.innerHTML = '<i class="fas fa-heart"></i> Saved';
    } else {
        favorites.splice(index, 1);
        elements.saveFavorite.innerHTML = '<i class="far fa-heart"></i> Save';
    }

    localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    elements.favorites.innerHTML = favorites.map(city => `
        <button class="favorite-btn" data-city="${city}">
            ${city}
        </button>
    `).join('');

    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.cityInput.value = btn.dataset.city;
            fetchWeather();
        });
    });
}

function saveLastCity(city) {
    localStorage.setItem('lastCity', city);
}

function loadLastCity() {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        elements.cityInput.value = lastCity;
        fetchWeather();
    }
}

function getLocationByGeolocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                );

                if (!response.ok) throw new Error("Location weather unavailable");

                currentData = await response.json();
                renderWeather(currentData);
                elements.cityInput.value = currentData.name;
                saveLastCity(currentData.name);
            } catch (err) {
                showError(err.message);
            }
        },
        (error) => {
            showError("Unable to retrieve your location");
        }
    );
}
