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

  const WEATHERAPI_KEY = '768f43eeeb0d4627ace203556261004';
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
        return { 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
          textColor: '#ffffff', 
          cardBg: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)'
        };
      case 'rainy':
        return { 
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', 
          textColor: '#ffffff', 
          cardBg: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.25)'
        };
      case 'sunny':
        return { 
          background: 'linear-gradient(135deg, #f2994a 0%, #f2c94c 100%)', 
          textColor: '#2d3436', 
          cardBg: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(255,255,255,0.5)'
        };
      case 'cloudy':
        return { 
          background: 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)', 
          textColor: '#2c3e50', 
          cardBg: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(255,255,255,0.4)'
        };
      default:
        return { 
          background: '#ffffff', 
          textColor: '#2c3e50', 
          cardBg: '#f8f9fa',
          border: '1px solid #e0e0e0'
        };
    }
  };

  // Fetch weather using WeatherAPI.com
  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${lat},${lon}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Weather API failed');
      }
      
      const data = await response.json();
      
      const temp = Math.round(data.current.temp_c);
      const humidity = data.current.humidity;
      const condition = data.current.condition.text;
      const location = `${data.location.name}, ${data.location.country}`;
      const recommendation = getWeatherRecommendation(temp, humidity, condition);
      const currentHour = new Date().getHours();
      const newTheme = getUITheme(condition, currentHour);
      
      setWeather({
        location: location,
        temperature: `${temp}°C`,
                        temperatureF: `${Math.round(temp * 9/5 + 32)}°F`,
        description: condition,
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
        throw new Error(errorData.error?.message || 'City not found');
      }
      
      const data = await response.json();
      
      const temp = Math.round(data.current.temp_c);
      const humidity = data.current.humidity;
      const condition = data.current.condition.text;
      const location = `${data.location.name}, ${data.location.country}`;
      const recommendation = getWeatherRecommendation(temp, humidity, condition);
      const currentHour = new Date().getHours();
      const newTheme = getUITheme(condition, currentHour);
      
      setWeather({
        location: location,
        temperature: `${temp}°C`,
        temperatureF: `${Math.round(temp * 9/5 + 32)}°F`,
        description: condition,
        recommendation: recommendation,
        humidity: humidity,
        condition: condition
      });
      
      setTheme(newTheme);
      setError(null);
      setShowCityInput(false);
      setPermissionDenied(false);
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
    }, 1800000);
    return () => clearInterval(interval);
  }, []);

  const themeStyles = getThemeStyles();

  return (
    <div className="card" style={{ 
      gridColumn: 'span 6', 
      position: 'relative', 
      overflow: 'hidden',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease'
    }}>
      {/* Animated background effects */}
      {theme === 'rainy' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
          animation: 'rain 0.5s linear infinite',
          zIndex: 0
        }} />
      )}
      
      {theme === 'sunny' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          zIndex: 0
        }} />
      )}
      
      <style>{`
        @keyframes rain {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .weather-card {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      
      <div className="weather-card" style={{ 
        position: 'relative', 
        zIndex: 1,
        background: themeStyles.background,
        borderRadius: '20px',
        padding: '24px',
        transition: 'all 0.3s ease'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${themeStyles.textColor}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '28px',
              background: themeStyles.cardBg,
              padding: '10px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              🌤️
            </div>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              color: themeStyles.textColor
            }}>
              Weather & Plant Care
            </h3>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {permissionDenied && (
              <button 
                onClick={() => setShowCityInput(!showCityInput)}
                style={{
                  background: themeStyles.cardBg,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'transform 0.2s',
                  color: themeStyles.textColor
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                📍
              </button>
            )}
            <button 
              onClick={getUserLocation} 
              disabled={loading}
              style={{
                background: themeStyles.cardBg,
                border: 'none',
                borderRadius: '10px',
                padding: '8px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'transform 0.2s',
                opacity: loading ? 0.6 : 1,
                color: themeStyles.textColor
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🔄
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 118, 117, 0.9)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(10px)'
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {/* Manual City Input */}
        {showCityInput && (
          <form onSubmit={handleManualCitySubmit} style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              background: themeStyles.cardBg,
              padding: '6px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <input
                type="text"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                placeholder="Enter city name..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${themeStyles.textColor}30`,
                  fontSize: '14px',
                  background: themeStyles.textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'white',
                  color: themeStyles.textColor,
                  outline: 'none'
                }}
              />
              <button 
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#45a049'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4CAF50'}
              >
                Set
              </button>
            </div>
          </form>
        )}

        {/* Main Weather Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Location and Main Info */}
          <div style={{
            textAlign: 'center'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: themeStyles.textColor,
              marginBottom: '8px'
            }}>
              {weather.location}
              {permissionDenied && !showCityInput && (
                <span style={{ 
                  fontSize: '12px', 
                  marginLeft: '10px', 
                  opacity: 0.7,
                  fontWeight: 'normal'
                }}>
                  (Default)
                </span>
              )}
            </h2>
            <div style={{
              fontSize: '14px',
              color: themeStyles.textColor,
              opacity: 0.8
            }}>
              {loading ? 'Fetching data...' : `Last updated: ${new Date().toLocaleTimeString()}`}
            </div>
          </div>

          {/* Weather Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '20px',
            alignItems: 'center',
            background: themeStyles.cardBg,
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Left Column - Temperature */}
            <div style={{ textAlign: 'center' }}>
              {loading ? (
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: themeStyles.textColor }}>---</div>
              ) : (
                <>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: themeStyles.textColor }}>
                    {weather.temperature}
                  </div>
                  <div style={{ fontSize: '16px', color: themeStyles.textColor, opacity: 0.8 }}>
                    {weather.temperatureF}
                  </div>
                </>
              )}
            </div>

            {/* Center Column - Weather Icon */}
            <div style={{ 
              textAlign: 'center',
              fontSize: '64px',
              padding: '10px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)'
            }}>
              {loading ? '⏳' : getWeatherIcon()}
            </div>

            {/* Right Column - Humidity */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: themeStyles.textColor }}>
                {loading ? '--' : `${weather.humidity}%`}
              </div>
              <div style={{ fontSize: '14px', color: themeStyles.textColor, opacity: 0.8 }}>
                Humidity
              </div>
            </div>
          </div>

          {/* Weather Description */}
          <div style={{
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '500',
            color: themeStyles.textColor,
            padding: '12px',
            background: themeStyles.cardBg,
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            {loading ? 'Fetching weather data...' : weather.description}
          </div>

          {/* Recommendation Card */}
          <div style={{
            padding: '20px',
            background: themeStyles.cardBg,
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${themeStyles.textColor}20`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>🌱</span>
              <h4 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                color: themeStyles.textColor
              }}>
                Plant Care Recommendation
              </h4>
            </div>
            <p style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: '1.5',
              color: themeStyles.textColor,
              opacity: 0.9
            }}>
              {loading ? 'Analyzing weather conditions...' : weather.recommendation}
            </p>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                <div>Loading weather data...</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;