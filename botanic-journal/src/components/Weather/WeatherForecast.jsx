import React, { useState, useEffect } from 'react';

const WeatherForecast = () => {
  const [weather, setWeather] = useState({
    location: 'Loading...',
    temperature: '--',
    description: 'Fetching weather data...',
    recommendation: '',
    humidity: 0,
    condition: 'clear'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);
  const [theme, setTheme] = useState('light');

  // YOUR OPENWEATHERMAP API KEY
  const WEATHERAPI_KEY = 'ce1f8136828d3f4f3b7db94db7fc11f2';

  const defaultCity = 'New York';

  const getWeatherRecommendation = (temp, humidity, condition) => {
    if (condition.toLowerCase().includes('rain')) {
      return "🌧️ Rain detected - Skip watering today to prevent overwatering";
    }
    if (temp > 30) {
      return "🔥 Hot day (above 30°C) - Water your plants more today";
    }
    if (temp < 5) {
      return "❄️ Cold temperatures (below 5°C) - Protect plants from frost";
    }
    if (humidity > 80) {
      return "💧 High humidity (over 80%) - Skip watering today";
    }
    if (humidity < 30) {
      return "🏜️ Very dry - Plants may need extra water today";
    }
    return "🌱 Moderate conditions - Regular watering schedule recommended";
  };

  const getUITheme = (condition, hour) => {
    const isNight = hour < 6 || hour > 18;
    if (isNight) return 'dark';
    if (condition.toLowerCase().includes('rain')) return 'rainy';
    if (condition.toLowerCase().includes('clear')) return 'sunny';
    if (condition.toLowerCase().includes('cloud')) return 'cloudy';
    return 'light';
  };

  const getThemeStyles = () => {
    switch(theme) {
      case 'dark':
        return { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', textColor: '#ffffff', cardBg: 'rgba(255,255,255,0.1)' };
      case 'rainy':
        return { background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', textColor: '#ffffff', cardBg: 'rgba(255,255,255,0.15)' };
      case 'sunny':
        return { background: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)', textColor: '#2d3436', cardBg: 'rgba(255,255,255,0.9)' };
      case 'cloudy':
        return { background: 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)', textColor: '#2c3e50', cardBg: 'rgba(255,255,255,0.8)' };
      default:
        return { background: '#ffffff', textColor: '#2c3e50', cardBg: '#f8f9fa' };
    }
  };

  // Fetch weather using OpenWeatherMap - CORRECT URL FORMAT
  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
     const response = await fetch(
  `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}`
);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Weather API failed');
      }
      
      const data = await response.json();
      const temp = Math.round(data.main.temp);
      const humidity = data.main.humidity;
      const condition = data.weather[0].description;
      const location = data.name;
      const recommendation = getWeatherRecommendation(temp, humidity, condition);
      const currentHour = new Date().getHours();
      const newTheme = getUITheme(condition, currentHour);
      
      setWeather({
        location: location,
        temperature: `${temp}°C (${Math.round(temp * 9/5 + 32)}°F)`,
        description: `${condition} • Humidity: ${humidity}%`,
        recommendation: recommendation,
        humidity: humidity,
        condition: condition
      });
      
      setTheme(newTheme);
      setError(null);
      setPermissionDenied(false);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Failed to fetch weather data');
      useDefaultCity();
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city) => {
    try {
      setLoading(true);
     const response = await fetch(
  `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${city}`
);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'City not found');
      }
      
      const data = await response.json();
      const temp = Math.round(data.main.temp);
      const humidity = data.main.humidity;
      const condition = data.weather[0].description;
      const location = data.name;
      const recommendation = getWeatherRecommendation(temp, humidity, condition);
      const currentHour = new Date().getHours();
      const newTheme = getUITheme(condition, currentHour);
      
      setWeather({
        location: location,
        temperature: `${temp}°C (${Math.round(temp * 9/5 + 32)}°F)`,
        description: `${condition} • Humidity: ${humidity}%`,
        recommendation: recommendation,
        humidity: humidity,
        condition: condition
      });
      
      setTheme(newTheme);
      setError(null);
      setShowCityInput(false);
    } catch (err) {
      console.error('City fetch error:', err);
      setError(`Couldn't find city "${city}": ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const useDefaultCity = () => {
    fetchWeatherByCity(defaultCity);
    setPermissionDenied(true);
  };

  const getUserLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      useDefaultCity();
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setError('Location permission denied. Using default city.');
          setPermissionDenied(true);
        } else {
          setError('Unable to get your location');
        }
        useDefaultCity();
      }
    );
  };

  const handleManualCitySubmit = (e) => {
    e.preventDefault();
    if (manualCity.trim()) {
      fetchWeatherByCity(manualCity);
    }
  };

  const getWeatherIcon = () => {
    const condition = weather.condition.toLowerCase();
    if (condition.includes('rain')) return '🌧️';
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('clear')) return '☀️';
    if (condition.includes('snow')) return '❄️';
    return '🌤️';
  };

  useEffect(() => {
    getUserLocation();
    const interval = setInterval(() => {
      if (!permissionDenied && !showCityInput) getUserLocation();
    }, 1800000); // Refresh every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const themeStyles = getThemeStyles();

  return (
    <div className="card" style={{ gridColumn: 'span 6', position: 'relative', overflow: 'hidden' }}>
      {theme === 'rainy' && (
        <style>{`
          @keyframes rain {
            0% { background-position: 0 0; }
            100% { background-position: 0 100%; }
          }
          .rain-effect {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            );
            animation: rain 0.5s linear infinite;
            z-index: 0;
          }
        `}</style>
      )}
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fas fa-cloud-sun"></i>
            Weather & Recommendations
          </h3>
          <div className="card-actions">
            {permissionDenied && (
              <button className="card-btn" onClick={() => setShowCityInput(!showCityInput)}>
                <i className="fas fa-city"></i>
              </button>
            )}
            <button className="card-btn" onClick={getUserLocation} disabled={loading}>
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </div>
        
        <div className="weather-widget" style={{ background: themeStyles.cardBg, borderRadius: '12px', padding: '20px', transition: 'all 0.3s ease' }}>
          {error && (
            <div style={{ backgroundColor: '#ff7675', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' }}>
              ⚠️ {error}
            </div>
          )}
          
          {showCityInput && (
            <form onSubmit={handleManualCitySubmit} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="Enter city name..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                />
                <button 
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Set City
                </button>
              </div>
            </form>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="weather-info" style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', color: themeStyles.textColor }}>
                {weather.location}
                {permissionDenied && !showCityInput && (
                  <span style={{ fontSize: '12px', marginLeft: '10px', opacity: 0.7 }}>(Default)</span>
                )}
              </h3>
              <div className="weather-temp" style={{ fontSize: '32px', fontWeight: 'bold', color: themeStyles.textColor, marginBottom: '8px' }}>
                {loading ? 'Loading...' : weather.temperature}
              </div>
              <div className="weather-desc" style={{ color: themeStyles.textColor, opacity: 0.9, marginBottom: '15px' }}>
                {loading ? 'Fetching data...' : weather.description}
              </div>
              <div className="weather-recommendation" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px', color: themeStyles.textColor, fontSize: '14px' }}>
                <i className="fas fa-lightbulb"></i> {loading ? 'Loading recommendation...' : weather.recommendation}
              </div>
            </div>
            <div className="weather-icon" style={{ fontSize: '64px', marginLeft: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px' }}>{getWeatherIcon()}</div>
              {!loading && (
                <div style={{ fontSize: '12px', marginTop: '8px', color: themeStyles.textColor, opacity: 0.7 }}>
                  {theme === 'sunny' && '☀️ Sunny'}
                  {theme === 'rainy' && '🌧️ Rainy'}
                  {theme === 'dark' && '🌙 Night'}
                  {theme === 'cloudy' && '☁️ Cloudy'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;