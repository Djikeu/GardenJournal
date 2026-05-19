import React, { useState, useEffect } from 'react';
import '../../weatherForecast.css';

const WEATHERAPI_KEY = '768f43eeeb0d4627ace203556261004';
const DEFAULT_CITY = 'New York';

const WeatherForecast = () => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [manualCity, setManualCity] = useState('');
    const [showCityInput, setShowCityInput] = useState(false);

    const getRecommendation = (temp, humidity, condition) => {
        const c = condition.toLowerCase();
        if (c.includes('rain') || c.includes('drizzle'))   return { icon: '🌧️', text: 'Rain detected — skip watering today to prevent overwatering.' };
        if (c.includes('snow'))                            return { icon: '❄️', text: 'Snow / freezing temperatures — protect outdoor plants and bring tender plants inside.' };
        if (temp >= 32)                                    return { icon: '🔥', text: 'Heat stress risk — water deeply early in the morning, mist humidity-loving plants.' };
        if (temp >= 28)                                    return { icon: '☀️', text: 'Warm day — most plants will need a regular water; check soil first.' };
        if (temp <= 5)                                     return { icon: '🥶', text: 'Cold day — protect plants from frost, avoid watering in the evening.' };
        if (humidity > 80)                                 return { icon: '💧', text: 'Very humid — hold off on watering, ensure airflow to prevent mildew.' };
        if (humidity < 30)                                 return { icon: '🏜️', text: 'Dry air — group humidity-lovers together or run a humidifier.' };
        return { icon: '🌱', text: 'Pleasant conditions — stick to your usual watering schedule.' };
    };

    const getIcon = (condition) => {
        const c = (condition || '').toLowerCase();
        if (c.includes('thunder') || c.includes('storm')) return '⛈️';
        if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
        if (c.includes('snow')) return '❄️';
        if (c.includes('clear')) return '☀️';
        if (c.includes('sun'))   return '☀️';
        if (c.includes('cloud')) return '☁️';
        if (c.includes('mist') || c.includes('fog'))     return '🌫️';
        return '🌤️';
    };

    const fetchWeather = async (queryParam) => {
        try {
            setLoading(true);
            const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${queryParam}&days=5&aqi=no&alerts=no`);
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error?.message || `Weather API HTTP ${res.status}`);
            }
            const data = await res.json();
            const c = data.current;
            const loc = data.location;
            const temp = Math.round(c.temp_c);
            const humidity = c.humidity;
            const condition = c.condition?.text || '';

            setWeather({
                location: `${loc.name}, ${loc.country}`,
                temperature: temp,
                tempF: Math.round(c.temp_f),
                description: condition,
                humidity,
                wind: Math.round(c.wind_kph),
                uv: c.uv,
                feelsLike: Math.round(c.feelslike_c),
                pressure: c.pressure_mb,
                visibility: c.vis_km,
                recommendation: getRecommendation(temp, humidity, condition),
                lastUpdated: c.last_updated,
            });

            const days = (data.forecast?.forecastday || []).map(d => ({
                date: d.date,
                day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                max: Math.round(d.day.maxtemp_c),
                min: Math.round(d.day.mintemp_c),
                condition: d.day.condition?.text || '',
                rainChance: d.day.daily_chance_of_rain || 0,
            }));
            setForecast(days);
            setError(null);
        } catch (err) {
            console.error('Weather error:', err);
            setError(err.message || 'Failed to fetch weather');
        } finally {
            setLoading(false);
        }
    };

    const getUserLocation = () => {
        setLoading(true);
        if (!navigator.geolocation) {
            setPermissionDenied(true);
            fetchWeather(DEFAULT_CITY);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
            (err) => {
                setPermissionDenied(err.code === err.PERMISSION_DENIED);
                fetchWeather(DEFAULT_CITY);
            },
            { timeout: 8000 }
        );
    };

    useEffect(() => {
        getUserLocation();
        const id = setInterval(() => { if (!showCityInput) getUserLocation(); }, 30 * 60 * 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCitySubmit = (e) => {
        e.preventDefault();
        if (manualCity.trim()) {
            fetchWeather(manualCity.trim());
            setShowCityInput(false);
            setManualCity('');
        }
    };

    if (loading && !weather) {
        return (
            <div className="wx-page">
                <div className="wx-hero wx-hero-skel">
                    <div className="wx-spinner" />
                    <p>Loading weather...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wx-page">
            {/* HERO */}
            <div className="wx-hero">
                <div className="wx-hero-bg" aria-hidden="true">
                    <span className="wx-leaf wx-leaf-1">🍃</span>
                    <span className="wx-leaf wx-leaf-2">🍃</span>
                </div>

                <div className="wx-hero-top">
                    <div>
                        <div className="wx-hero-loc">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s-8-7.5-8-13a8 8 0 1 1 16 0c0 5.5-8 13-8 13z" />
                                <circle cx="12" cy="9" r="3" />
                            </svg>
                            <span>{weather?.location || '—'}</span>
                        </div>
                        <h1 className="wx-hero-title">Weather & Plant Care</h1>
                        {weather?.lastUpdated && (
                            <div className="wx-hero-updated">Updated {weather.lastUpdated.split(' ')[1]}</div>
                        )}
                    </div>

                    <button className="wx-action-btn" onClick={() => setShowCityInput(v => !v)}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                        </svg>
                        {showCityInput ? 'Cancel' : 'Change city'}
                    </button>
                </div>

                {showCityInput && (
                    <form className="wx-city-form" onSubmit={handleCitySubmit}>
                        <input
                            type="text"
                            value={manualCity}
                            onChange={(e) => setManualCity(e.target.value)}
                            placeholder="Enter a city (e.g. Zagreb, Tokyo, Berlin)"
                            autoFocus
                        />
                        <button type="submit">Search</button>
                    </form>
                )}

                <div className="wx-hero-main">
                    <div className="wx-hero-icon">{getIcon(weather?.description)}</div>
                    <div>
                        <div className="wx-hero-temp">{weather?.temperature}°<span className="wx-hero-temp-unit">C</span></div>
                        <div className="wx-hero-cond">{weather?.description}</div>
                        <div className="wx-hero-feels">Feels like {weather?.feelsLike}°C</div>
                    </div>
                </div>

                {error && <div className="wx-hero-error">⚠️ {error}</div>}
                {permissionDenied && !error && (
                    <div className="wx-hero-hint">📍 Using default city. Allow location access for local weather.</div>
                )}
            </div>

            {/* RECOMMENDATION CARD */}
            {weather?.recommendation && (
                <div className="wx-rec-card">
                    <div className="wx-rec-icon">{weather.recommendation.icon}</div>
                    <div>
                        <div className="wx-rec-label">Plant care recommendation</div>
                        <div className="wx-rec-text">{weather.recommendation.text}</div>
                    </div>
                </div>
            )}

            {/* METRIC GRID */}
            <div className="wx-metric-grid">
                <MetricCard icon="💧" label="Humidity"   value={`${weather?.humidity}%`}    />
                <MetricCard icon="💨" label="Wind"       value={`${weather?.wind} km/h`}    />
                <MetricCard icon="☀️" label="UV index"   value={`${weather?.uv ?? '—'}`}    />
                <MetricCard icon="🌡️" label="Pressure"   value={`${weather?.pressure} mb`}  />
                <MetricCard icon="👁️" label="Visibility" value={`${weather?.visibility} km`}/>
                <MetricCard icon="🌬️" label="Feels like" value={`${weather?.feelsLike}°C`}  />
            </div>

            {/* 5-DAY FORECAST */}
            {forecast.length > 0 && (
                <div className="wx-section">
                    <h2 className="wx-section-title">5-day forecast</h2>
                    <div className="wx-forecast-grid">
                        {forecast.map((d, i) => (
                            <div key={d.date} className={`wx-forecast-card ${i === 0 ? 'today' : ''}`}>
                                <div className="wx-forecast-day">{i === 0 ? 'Today' : d.day}</div>
                                <div className="wx-forecast-icon">{getIcon(d.condition)}</div>
                                <div className="wx-forecast-cond">{d.condition}</div>
                                <div className="wx-forecast-temps">
                                    <span className="wx-temp-max">{d.max}°</span>
                                    <span className="wx-temp-min">{d.min}°</span>
                                </div>
                                {d.rainChance > 0 && (
                                    <div className="wx-rain-chance">💧 {d.rainChance}%</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ icon, label, value }) => (
    <div className="wx-metric">
        <span className="wx-metric-icon">{icon}</span>
        <div>
            <div className="wx-metric-label">{label}</div>
            <div className="wx-metric-value">{value}</div>
        </div>
    </div>
);

export default WeatherForecast;
